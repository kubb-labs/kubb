---
"kubb": patch
---

Add a Kubb Claude Code plugin and marketplace. It brings Kubb, a meta framework for code generation, into Claude Code so you can turn an OpenAPI spec into TypeScript types, Zod schemas, Axios clients, React Query hooks and more. The plugin ships `/kubb:init`, `/kubb:generate` and `/kubb:validate` commands that run the `kubb` CLI, a `config` skill and a `kubb-expert` agent, and the `@kubb/mcp` server (`kubb mcp`) for conversational generation. Add `kubb-labs/kubb` as a plugin marketplace to install it.
