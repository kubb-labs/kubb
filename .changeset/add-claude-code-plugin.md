---
"kubb": patch
---

Add an official Kubb Claude Code plugin and marketplace. It brings the Kubb meta framework for code generation into Claude Code, turning an OpenAPI spec into TypeScript types, Zod schemas, Axios clients, React Query hooks and more. The plugin runs the `@kubb/mcp` server through `kubb mcp`, exposing the `init`, `generate` and `validate` tools to Claude, and ships `/kubb:init`, `/kubb:generate` and `/kubb:validate` commands that mirror the CLI. Install it with `kubb-labs/kubb` as a plugin marketplace.
