---
layout: doc

title: Kubb Plugins - Complete Plugin Directory
description: Explore all Kubb plugins for OpenAPI code generation with TypeScript, React Query, Zod, MSW, SWR, and more. Choose the right plugins for your project.
outline: deep
---

# Plugins

Kubb uses a plugin-based architecture to generate different types of code from OpenAPI specifications. Each plugin extends Kubb's capabilities, enabling you to generate everything from TypeScript types to API clients and testing utilities.

## Core Plugins

### [@kubb/plugin-oas](/plugins/plugin-oas)

Parse and validate your OpenAPI schema with this core plugin.

This is the foundational plugin that reads and processes OpenAPI/Swagger specifications, making them available for other plugins to consume.

```typescript
import { pluginOas } from '@kubb/plugin-oas'

pluginOas()
```

### [@kubb/plugin-ts](/plugins/plugin-ts)

Generate TypeScript types from your OpenAPI schema.

Creates type-safe TypeScript interfaces and types based on your API schema definitions, ensuring your code stays in sync with your API contract.

```typescript
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  output: {
    path: './types',
  },
})
```

## Client Generation

### [@kubb/plugin-client](/plugins/plugin-client)

Generate API client code for handling API requests.

By default, this plugin uses [Axios](https://axios-http.com/docs/intro), but you can add your own client. See [Use of Fetch](/guide/fetch) for an example.

```typescript
import { pluginClient } from '@kubb/plugin-client'

pluginClient({
  output: {
    path: './clients',
  },
})
```

## Data Query Hooks

### [@kubb/plugin-react-query](/plugins/plugin-react-query)

Generate React Query hooks from your OpenAPI schema.

Creates hooks for [TanStack Query (React Query)](https://tanstack.com/query) that handle data fetching, caching, and state management for React applications.

```typescript
import { pluginReactQuery } from '@kubb/plugin-react-query'

pluginReactQuery({
  output: {
    path: './hooks',
  },
})
```

### [@kubb/plugin-solid-query](/plugins/plugin-solid-query)

Generate SolidJS Query hooks from your OpenAPI schema.

Creates hooks for [TanStack Query (Solid)](https://tanstack.com/query) optimized for SolidJS applications.

```typescript
import { pluginSolidQuery } from '@kubb/plugin-solid-query'

pluginSolidQuery({
  output: {
    path: './hooks',
  },
})
```

### [@kubb/plugin-svelte-query](/plugins/plugin-svelte-query)

Generate SvelteQuery hooks from your OpenAPI schema.

Creates hooks for [TanStack Query (Svelte)](https://tanstack.com/query) optimized for Svelte applications.

```typescript
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query'

pluginSvelteQuery({
  output: {
    path: './hooks',
  },
})
```

### [@kubb/plugin-vue-query](/plugins/plugin-vue-query)

Generate Vue Query hooks from your OpenAPI schema.

Creates composables for [TanStack Query (Vue)](https://tanstack.com/query) optimized for Vue applications.

```typescript
import { pluginVueQuery } from '@kubb/plugin-vue-query'

pluginVueQuery({
  output: {
    path: './hooks',
  },
})
```

### [@kubb/plugin-swr](/plugins/plugin-swr)

Generate [SWR](https://swr.vercel.app/) hooks from your OpenAPI schema.

Creates hooks for Vercel's SWR library, providing a lightweight alternative for data fetching in React applications.

```typescript
import { pluginSwr } from '@kubb/plugin-swr'

pluginSwr({
  output: {
    path: './hooks',
  },
})
```

## Validation & Mocking

### [@kubb/plugin-zod](/plugins/plugin-zod)

Generate [Zod](https://zod.dev/) validation schemas from your OpenAPI schema.

Creates runtime validation schemas that ensure your data matches the API contract at runtime, providing type-safe validation with excellent error messages.

```typescript
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({
  output: {
    path: './zod',
  },
})
```

### [@kubb/plugin-faker](/plugins/plugin-faker)

Generate mock data using [Faker](https://fakerjs.dev/).

Creates realistic mock data generators based on your schema definitions, useful for development and testing.

```typescript
import { pluginFaker } from '@kubb/plugin-faker'

pluginFaker({
  output: {
    path: './mocks',
  },
})
```

### [@kubb/plugin-msw](/plugins/plugin-msw)

Generate [MSW](https://mswjs.io/) API mock handlers from your OpenAPI schema.

Creates Mock Service Worker handlers that intercept API requests during development and testing, enabling you to develop against a mocked backend.

```typescript
import { pluginMsw } from '@kubb/plugin-msw'

pluginMsw({
  output: {
    path: './mocks',
  },
})
```

## Testing

### [@kubb/plugin-cypress](/plugins/plugin-cypress)

Generate Cypress request definitions from your OpenAPI schema.

Creates type-safe Cypress commands for end-to-end testing, making it easy to test your API integration.

```typescript
import { pluginCypress } from '@kubb/plugin-cypress'

pluginCypress({
  output: {
    path: './cypress',
  },
})
```

## Documentation

### [@kubb/plugin-redoc](/plugins/plugin-redoc)

Generate API documentation using [Redoc](https://redocly.com/).

Creates beautiful, interactive API documentation from your OpenAPI schema.

```typescript
import { pluginRedoc } from '@kubb/plugin-redoc'

pluginRedoc({
  output: {
    path: './docs',
  },
})
```

## AI Integration

### [@kubb/plugin-mcp](/plugins/plugin-mcp)

Generate [Model Context Protocol](https://modelcontextprotocol.io/introduction) servers that enable AI models to interact with your API.

Creates MCP servers that expose your API to AI assistants and agents, enabling them to make authenticated API calls and understand your API structure.

```typescript
import { pluginMcp } from '@kubb/plugin-mcp'

pluginMcp({
  output: {
    path: './mcp',
  },
})
```

## Example

Plugins are configured in your `kubb.config.ts` file:

```typescript twoslash
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './petstore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginOas(),
    pluginTs(),
    pluginClient(),
  ],
})
```

Each plugin can be configured with its own options. See individual plugin documentation for details.

## Plugin Architecture

All Kubb plugins follow a consistent pattern:

- **Installation**: Add via npm/pnpm/yarn/bun
- **Configuration**: Configure in `kubb.config.ts`
- **Output**: Specify output directory and file options
- **Dependencies**: Many plugins depend on `@kubb/plugin-oas`

For detailed configuration options and usage examples, visit each plugin's documentation page.
