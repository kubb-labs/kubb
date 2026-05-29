---
"kubb": patch
---

Add a Kubb Claude Code plugin and marketplace. It brings Kubb, a meta framework for code generation, into Claude Code so you can turn an OpenAPI spec into TypeScript types, Zod schemas, Axios clients, React Query hooks and more. The plugin runs the `@kubb/mcp` server through `kubb mcp`, which gives Claude the `init`, `generate` and `validate` tools, and adds matching `/kubb:init`, `/kubb:generate` and `/kubb:validate` commands. Add `kubb-labs/kubb` as a plugin marketplace to install it.
