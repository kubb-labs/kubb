# ADR-0002: Generic agent for arbitrary plugins and adapters

| Status   | Authors        | Reviewers      | Issue                                              | Decision date |
| -------- | -------------- | -------------- | -------------------------------------------------- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle | [#3220](https://github.com/kubb-labs/kubb/pull/3220) | 2026-05-01    |

## Context

`@kubb/agent` is the HTTP/WebSocket process Kubb Studio talks to. It loads a `kubb.config.ts` from disk (or accepts a sandbox config from the UI), resolves plugins and an adapter, runs `createKubb()`, and streams lifecycle events back to the browser.

Kubb ships a default adapter (`@kubb/adapter-oas`) and a set of first-party plugins (`plugin-ts`, `plugin-zod`, `plugin-react-query`, …). The community can publish their own plugins and adapters as separate npm packages. Each plugin and adapter defines its own option shape — the agent has no built-in knowledge of those shapes, and there is no curated allow-list.

Studio needs to render configuration forms for whatever plugins and adapters are available in a given deployment. Two questions must be answered before v5:

1. How does the agent know which plugins/adapters can be configured, and what their options are?
2. Where is the trust boundary that decides whether arbitrary npm packages can be loaded?

The v4 agent partially hard-coded plugin option types in `JSONKubbConfig`, which couples the agent to first-party plugin versions and rules out community packages. v5's broader plugin surface (object-shaped `barrel`, opt-out `false` values, new `coercion`/`infinite`/`query`/`mutation` blocks) makes that coupling more painful and more brittle.

## Decision

The agent treats plugins and adapters as opaque, discoverable units. Their option shapes are not modeled in the agent's TypeScript types and not validated by the agent at runtime.

- `JSONKubbConfig.plugins[].options` and `JSONKubbConfig.adapter` are typed as opaque `object` blobs. The agent does not import plugin or adapter packages to type their options.
- Discovery is performed against what is installed in the **Docker image** that runs the agent. The image author chooses which plugins and adapters are available; the agent enumerates them at startup.
- Each plugin and adapter ships its own JSON/YAML option schema (the `plugin-*.yaml` / `adapter-*.yaml` files under `schemas/`). The agent serves those schemas to Studio so the UI can render forms; it does not embed the schemas itself.
- The agent forwards Studio's `options` blob unchanged to the plugin or adapter factory. Schema validation is the plugin's responsibility.
- The agent never installs packages at runtime. Anything not present in the image is not available to Studio.

`resolvePlugins` and `resolveAdapter` therefore work off package names alone, with no built-in registry of "known" plugins.

## Rationale

Hard-coding plugin/adapter option types in the agent forces a release of `@kubb/agent` every time a plugin's options change, and excludes community packages entirely. A generic agent decouples the agent's release cadence from the plugin ecosystem and lets a single agent binary serve any combination of plugins.

Pinning the trust boundary to the Docker image matches how the agent is actually deployed: operators choose an image, the image declares its dependencies, and everything inside the image is implicitly trusted. Allowing the agent to `npm install` packages on demand would move the trust boundary from "what the operator built" to "whatever the running agent can fetch," which is materially less safe.

Schemas-as-data (served from the installed packages) keeps Studio in sync with the exact plugin versions present in the image, without requiring the agent to be rebuilt when a plugin adds a new option.

## Consequences

### Positive

- A single `@kubb/agent` build supports any current or future plugin and adapter, including community packages.
- Operators control the plugin/adapter surface by choosing or building a Docker image — no agent code change required.
- The agent's TypeScript surface stays small and stable as the plugin ecosystem evolves.
- No runtime package installation removes a class of supply-chain risk.
- Plugins own their option schemas and validation, keeping responsibilities aligned with package boundaries.

### Negative

- Studio cannot configure plugins or adapters that are not installed in the running image. Adding a new plugin requires a new image.
- The agent cannot give early type-level feedback on misconfigured plugin options; errors surface when the plugin factory runs.
- Operators are responsible for vetting any third-party plugins they add to their image. There is no central allow-list.
- Schema discovery requires every plugin/adapter to ship a schema file in a known location; plugins that omit it will not get a Studio form.

## Considered options

**Option A: Generic agent with image-defined plugins (chosen)**

Plugins and adapters are opaque to the agent and discovered from the Docker image. Schemas are served from installed packages. The agent only resolves and forwards.

**Option B: Curated allow-list of supported plugins**

The agent ships with TypeScript types for a known set of first-party plugins and rejects anything else. Predictable and well-typed, but blocks community plugins and forces an agent release for every plugin change.

**Option C: Runtime `npm install` from a registry**

The agent installs requested plugins on demand. Maximum flexibility for Studio users, but moves the trust boundary off the image and introduces supply-chain and reproducibility risks that are unacceptable for a server process.

## Related ADRs

None.
