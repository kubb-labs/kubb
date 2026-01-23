---
layout: doc

title: Introduction
outline: deep
---

# Introduction

Kubb generates TypeScript code from OpenAPI/Swagger specifications.

## What It Generates

Transform your OpenAPI spec into:

- **[TypeScript types](/plugins/plugin-ts/)** - Type-safe interfaces and schemas
- **HTTP clients** - [Axios](/plugins/plugin-client/), Fetch, or custom clients
- **React Query hooks** - [React](/plugins/plugin-react-query/), [Vue](/plugins/plugin-vue-query/), [Solid](/plugins/plugin-solid-query/), [Svelte](/plugins/plugin-svelte-query/)
- **Validators** - [Zod](/plugins/plugin-zod/) schemas (v4 support)
- **Mock data** - [Faker.js](/plugins/plugin-faker/) generators
- **API mocks** - [MSW](/plugins/plugin-msw/) handlers
- **Test utilities** - [Cypress](/plugins/plugin-cypress/) commands
- **API documentation** - [Redoc](/plugins/plugin-redoc/) integration
- **MCP servers** - [Model Context Protocol](https://modelcontextprotocol.io/) for AI assistants

Extend Kubb with custom plugins to integrate other libraries or generate additional code.

<iframe src="https://github.com/sponsors/stijnvanhulle/button" title="Sponsor stijnvanhulle" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

## Key Features

- **Node.js 20+** - Modern JavaScript runtime support
- **OpenAPI 2.0, 3.0, 3.1** - All major OpenAPI versions supported
- **Plugin system** - Extend with custom generators or use community plugins
- **CLI with progress tracking** - Monitor generation with progress bars and detailed logs
- **Debug mode** - Inspect generation with [React DevTools](/guide/debugging)
- **Barrel files** - Automatic `index.ts` generation for clean imports
- **Type-safe** - Full TypeScript support with strict type checking
- **Fast** - Parallel processing for large API specifications

## Why Kubb?

**Problem**: Keeping frontend code in sync with backend APIs requires manual updates when the API changes.

**Solution**: Contract-first development with OpenAPI specifications and code generation.

**Kubb's approach**: Most code generators focus on a single output (types *or* React Query hooks). Kubb uses a plugin system to generate multiple outputs from one OpenAPI spec:

- Generate types, hooks, validators, and mocks in one command
- Maintain consistency across your codebase
- Extend with [custom plugins](/guide/plugins/) for specific needs

This eliminates manual API client maintenance and reduces type mismatches between frontend and backend.


## Sponsoring
Kubb is open source and built by the community. Help us build Kubb by [sponsoring](https://github.com/sponsors/stijnvanhulle) us.

## Our Community
Come and chat with us on [Discord](https://discord.gg/shfBFeczrm)!

We're always looking for contributions.
