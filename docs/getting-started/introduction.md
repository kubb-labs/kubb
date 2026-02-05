---
layout: doc

title: Kubb - OpenAPI TypeScript Code Generator
description: Generate type-safe TypeScript clients, React Query hooks, Zod schemas, and MSW mocks from OpenAPI/Swagger specifications automatically.
outline: deep
---

# Kubb - OpenAPI TypeScript Code Generator

**Kubb is a plugin-based code generator that transforms OpenAPI/Swagger specifications into production-ready TypeScript code.** Generate type-safe API clients, React Query hooks, Zod validators, MSW mocks, and more—all from a single OpenAPI file.

## What is Kubb?

Kubb solves the problem of keeping frontend code synchronized with backend APIs. Instead of manually writing API clients and updating types when your API changes, Kubb generates everything automatically from your OpenAPI specification.

**Who should use Kubb?**
- Frontend developers using TypeScript with REST APIs
- Teams practicing contract-first API development
- Projects using React Query, SWR, or other data-fetching libraries
- Developers who need type-safe API clients without manual maintenance

**When to use Kubb?**
- When your API has an OpenAPI/Swagger specification
- When you want to eliminate type mismatches between frontend and backend
- When you need to generate multiple code artifacts (types, hooks, mocks) from one source

## Quick Start Guide

Get Kubb running in under 2 minutes with the interactive setup wizard:

```bash
npx kubb init
```

This command automatically:
1. Creates a `package.json` (if your project doesn't have one)
2. Prompts you to select your OpenAPI/Swagger file
3. Lets you choose plugins (TypeScript, React Query, Zod, etc.)
4. Installs all required npm packages
5. Generates a configured `kubb.config.ts` file

Generate your code:

```bash
npx kubb generate
```

**Done!** Your type-safe API client code is ready to import. [View the complete quick-start guide →](/getting-started/quick-start)

## What Code Does Kubb Generate?

Transform your OpenAPI/Swagger specification into production-ready TypeScript code:

### Type-Safe TypeScript
- **[TypeScript types](/plugins/plugin-ts/)** - Interfaces, types, and schemas matching your API
- Full IntelliSense and autocomplete support

### HTTP Clients
- **[API clients](/plugins/plugin-client/)** - Axios, Fetch, or custom HTTP client wrappers
- Type-safe request/response handling

### Data Fetching Hooks
Generate hooks for popular frameworks:
- **[React Query](/plugins/plugin-react-query/)** - `useQuery`, `useMutation` hooks for React
- **[Vue Query](/plugins/plugin-vue-query/)** - TanStack Query for Vue.js
- **[Solid Query](/plugins/plugin-solid-query/)** - TanStack Query for Solid.js
- **[Svelte Query](/plugins/plugin-svelte-query/)** - TanStack Query for Svelte
- **[SWR](/plugins/plugin-swr/)** - React hooks for SWR library

### Validation & Mocking
- **[Zod schemas](/plugins/plugin-zod/)** - Runtime validation with Zod v4 support
- **[Faker.js generators](/plugins/plugin-faker/)** - Mock data generation
- **[MSW handlers](/plugins/plugin-msw/)** - API mocking for tests and development

### Testing & Documentation
- **[Cypress commands](/plugins/plugin-cypress/)** - End-to-end test utilities
- **[ReDoc integration](/plugins/plugin-redoc/)** - Beautiful API documentation
- **[MCP servers](/plugins/plugin-mcp/)** - [Model Context Protocol](https://modelcontextprotocol.io/) for AI assistants

All code is generated from a single OpenAPI source. Extend functionality with custom plugins to integrate other libraries or generate additional code patterns.

<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

## Key Features

### OpenAPI Support
- **OpenAPI 2.0** (Swagger)
- **OpenAPI 3.0**
- **OpenAPI 3.1**
All major OpenAPI/Swagger versions fully supported.

### Developer Experience
- **Node.js 20+** - Modern JavaScript runtime
- **CLI with progress tracking** - Real-time generation progress with detailed logs
- **Debug mode** - Inspect generation process with [React DevTools](/guide/debugging)
- **TypeScript-first** - Full TypeScript support with strict type checking
- **Fast generation** - Parallel processing optimized for large API specifications

### Code Organization
- **Barrel files** - Automatic `index.ts` generation for clean, organized imports
- **Plugin system** - Modular architecture lets you use only what you need
- **Customizable output** - Control file structure, naming conventions, and formatting

## Why Choose Kubb?

### The Problem
Manually maintaining API clients is time-consuming and error-prone. When backend APIs change, frontend developers must:
- Update TypeScript types manually
- Modify API client functions
- Fix type mismatches between frontend and backend
- Update mocks and tests

This creates synchronization issues and slows down development.

### Kubb's Solution
**Contract-first development** with automatic code generation. Kubb reads your OpenAPI specification and generates all necessary code in a single command.

**Key advantages:**
- **Single source of truth** - OpenAPI spec drives all generated code
- **Plugin-based architecture** - Generate exactly what you need (types, hooks, validators, mocks)
- **Zero maintenance** - Regenerate when API changes, no manual updates
- **Type safety** - Eliminate runtime type errors with compile-time checks
- **Extensible** - Create custom plugins for specific project needs

Unlike manual coding or basic type generators, Kubb generates complete, production-ready code across your entire development stack.


## Sponsoring
Kubb is open source and built by the community. Help us build Kubb by [sponsoring](https://github.com/sponsors/stijnvanhulle) us.

## Community & Support

### Get Help
**Discord community** - Join our [Discord server](https://discord.gg/shfBFeczrm) for real-time help, discussions, and community support.

**GitHub** - Report bugs, request features, or browse existing issues on [GitHub](https://github.com/kubb-labs/kubb/issues).

### Contribute
We're always looking for contributions. Whether it's bug fixes, documentation improvements, or new features, we appreciate your help.

## Next Steps

Ready to start? Choose your path:

- **[Installation Guide](/getting-started/installation)** - Set up Kubb in your project
- **[Quick Start Tutorial](/getting-started/quick-start)** - Generate your first code in minutes
- **[Configuration Reference](/getting-started/configure)** - Learn all configuration options
- **[Plugin Documentation](/plugins)** - Explore available plugins and their options

## Frequently Asked Questions

**Q: Does Kubb work with JavaScript projects?**
Yes. While Kubb generates TypeScript files, you can use them in JavaScript projects or transpile the output.

**Q: Can I use Kubb with GraphQL?**
No, Kubb is specifically designed for OpenAPI/Swagger REST APIs. For GraphQL, consider using GraphQL Code Generator.

**Q: How do I update generated code when my API changes?**
Simply re-run `npx kubb generate`. The generator will update all files based on the latest OpenAPI specification.

**Q: Can I customize the generated code?**
Yes, through generators, transformers, and custom plugins. See the [Generators guide](/guide/generators) for details.

**Q: Is Kubb production-ready?**
Yes, Kubb is used in production by many teams. The generated code is type-safe, well-tested, and follows TypeScript best practices.
