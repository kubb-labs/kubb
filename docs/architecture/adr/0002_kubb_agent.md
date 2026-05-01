# ADR-0002: Kubb Agent — generic, image-scoped, AI-ready code generation server

| Status   | Authors        | Reviewers      | Issue                                                | Decision date |
| -------- | -------------- | -------------- | ---------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3220](https://github.com/kubb-labs/kubb/pull/3220) | 2026-05-01    |

## Context

`@kubb/agent` is the HTTP/WebSocket process that Kubb Studio and external clients — including LLM-powered AI agents — talk to. It loads a `kubb.config.ts` from disk (or accepts a sandbox config over the wire), resolves plugins and an adapter, runs `createKubb()`, and streams lifecycle events back to the caller.

Three problems exist in the v4 design:

1. **Hard-coded plugin knowledge.** `JSONKubbConfig` partially typed plugin option shapes, coupling the agent binary to first-party plugin versions and ruling out community packages.
2. **No machine-readable capability manifest.** There is no structured way for an AI agent or orchestration layer to discover what plugins/adapters are available and what their options are, making autonomous configuration unsafe and fragile.
3. **Unclear security perimeter.** The boundary between what an external caller may configure and what the running process may load was not formally stated, leaving the door open for supply-chain and injection attacks as the agent is exposed to automated systems.

v5 widens the plugin option surface (object-shaped `barrel`, opt-out `false` values, new `coercion`/`infinite`/`query`/`mutation` blocks) and introduces first-class support for AI-driven callers. Both changes demand a cleaner architectural statement.

## Decision

The Kubb Agent is a **generic, image-scoped, AI-ready code generation server**.

### Generic — no hard-coded plugin or adapter knowledge

`JSONKubbConfig.plugins[].options` and `JSONKubbConfig.adapter` are typed as opaque `object` blobs. The agent does not import plugin or adapter packages to type or validate their options. `resolvePlugins` and `resolveAdapter` work off package names alone; option validation is the plugin's own responsibility.

### Image-scoped — the Docker image is the capability and trust boundary

The set of available plugins and adapters is determined exclusively by what is installed in the Docker image that runs the agent. At startup the agent enumerates installed packages, reads their `plugin-*.yaml` / `adapter-*.yaml` schema files, and assembles a **capability manifest**. Anything not present in the image cannot be loaded or configured. The agent never installs packages at runtime.

### AI-ready — machine-readable manifest and structured API

The agent exposes a capability manifest endpoint (`GET /manifest`) that returns a stable JSON document describing every installed plugin and adapter: its name, version, and full option schema. AI agents and orchestration layers consume this manifest to generate valid configs autonomously without guessing option shapes.

The `/generate` and `/sandbox` endpoints accept and return structured, versioned JSON. The WebSocket event stream uses typed, single-context-object tuples (see `KubbHooks`) so LLM tool-call parsers can consume events without fragile string parsing.

An AI caller workflow looks like:

```
GET /manifest         → list of { name, version, schema }
POST /sandbox         → { input, plugins: [{ name, options }] }  (validated against schema)
WS  /events/:id       → stream of typed kubb:* events
GET /result/:id       → { files, sources }
```

### Security model

The following controls define the agent's security posture:

**Trust boundary — image**
- Only packages present in the Docker image at build time may be resolved. The agent maintains an allowlist derived from the image's `node_modules` at startup; any `resolvePlugins` call referencing a package not in that list is rejected with a `403`.
- The image is built and signed by the operator. Community plugins must be explicitly added to the image by the operator; they are not fetched on demand.

**Input sanitization**
- `input.data` (sandbox spec) is size-limited (configurable, default 1 MB) and validated as a string before being passed to the adapter. No filesystem paths or URLs are accepted in sandbox mode.
- `input.path` (disk mode) is resolved relative to a configurable `root` and must not escape that directory (path traversal check: resolved path must start with `root`).
- Plugin `options` blobs are size-limited (default 64 KB per plugin) before forwarding to the factory.

**Authentication and authorization**
- The agent requires a bearer token (`KUBB_AGENT_TOKEN` environment variable) on all HTTP and WebSocket endpoints unless `auth: false` is explicitly set in the agent config (development only).
- Studio and AI callers must present the token. The token is set at image build time or injected as a secret at container runtime.
- No multi-tenancy: each agent process serves a single operator-defined configuration. Multiple tenants require separate containers.

**No arbitrary code execution**
- `hooks.done` shell commands from disk configs are executed in a restricted shell with a configurable allowlist of commands. Sandbox configs may not define `hooks`.
- The agent does not evaluate JavaScript or TypeScript received over the wire. Only pre-installed plugin/adapter factories (from the image) are invoked.

**Rate limiting and resource caps**
- Concurrent generation runs are capped (default: 2) to prevent resource exhaustion.
- Each generation run has a timeout (default: 60 s). Runs that exceed the timeout are terminated and an error event is emitted.

**Audit log**
- Every generation request is logged with caller identity (token hash), timestamp, plugin list, input hash, and outcome. Logs are written to stdout in structured JSON for collection by the operator's log infrastructure.

## Rationale

**Generic** removes the coupling between agent releases and plugin releases. A community plugin author does not need Anthropic or Kubb Labs involvement to make their plugin configurable from Studio or an AI agent.

**Image-scoped** keeps the trust boundary under operator control. An operator who builds an image decides exactly what code runs. Allowing runtime installs would transfer that control to whoever sends a request to the agent — unacceptable when the agent is exposed to autonomous AI callers.

**AI-ready** acknowledges that Kubb Studio is not the only client. LLM tool calls, CI pipelines, and orchestration agents are all plausible callers. A stable, machine-readable API with typed events lets those callers work reliably without bespoke integration work.

The security controls are proportional to the threat model: the agent runs user-defined code (plugins) and accepts user-controlled data (OpenAPI specs and plugin options). Both of those are high-risk inputs, and the agent may be the target of prompt-injected tool calls from an LLM that was itself manipulated. Defense in depth — image boundary + input limits + auth + no runtime installs — is appropriate.

## Consequences

### Positive

- A single `@kubb/agent` binary works with any plugin and adapter combination without code changes.
- AI agents and LLM tool callers can discover capabilities and generate valid configs from the manifest, reducing hallucination risk.
- Operators control the attack surface by choosing what goes into the image.
- No runtime package installation eliminates an entire class of supply-chain attack.
- Typed event tuples give AI callers a stable parsing target as the plugin ecosystem evolves.
- The structured audit log supports compliance and incident response.

### Negative

- Adding a plugin requires rebuilding and redeploying the image; there is no hot-add.
- The agent cannot give early type-level feedback on misconfigured plugin options; errors surface when the factory runs.
- Plugins that do not ship a schema file are invisible to Studio and AI callers.
- Bearer token auth is simple but not multi-tenant; operators who need per-user access control must layer that separately (e.g. a reverse proxy).
- The `hooks.done` allowlist adds operational overhead: operators must configure it for every custom hook command they use.

## Considered options

**Option A: Generic, image-scoped, AI-ready agent (chosen)**

Plugins and adapters are opaque, discovered from the image. A capability manifest enables AI callers. Security controls are layered: image boundary, input limits, auth, no runtime installs.

**Option B: Curated allow-list of supported plugins**

The agent ships with TypeScript types for a known set of first-party plugins and rejects everything else. Predictable and well-typed, but blocks community plugins and requires an agent release for every plugin option change. AI callers still have no manifest to work from.

**Option C: Runtime `npm install` on demand**

Maximum flexibility — any plugin available on npm can be used without rebuilding the image. Unacceptable: moves the trust boundary from the operator-controlled image to whatever an AI or malicious caller can request. Reproducibility and supply-chain integrity cannot be guaranteed.

**Option D: Agent embeds an LLM that generates configs**

An in-process LLM interprets natural-language requests and generates `kubb.config.ts` content. Interesting long-term, but couples the agent to a specific model and requires the agent to validate its own LLM output — a significant complexity increase. External AI callers consuming the manifest API achieve the same user outcome without embedding a model in the server process.

## Related ADRs

None.
