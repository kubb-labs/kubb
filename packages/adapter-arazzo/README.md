<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/adapter-arazzo

### Arazzo workflow adapter for Kubb

Parses an [Arazzo](https://spec.openapis.org/arazzo/latest.html) document, loads every OpenAPI document it lists under `sourceDescriptions`, and transforms each workflow into a `@kubb/ast` `InputNode` for downstream code generation plugins.

## Installation

```bash
bun add @kubb/adapter-arazzo
# or
pnpm add @kubb/adapter-arazzo
# or
npm install @kubb/adapter-arazzo
```

## Usage

Use `adapterArazzo` inside your `kubb.config.ts`:

```typescript
import { defineConfig } from 'kubb'
import { adapterArazzo } from '@kubb/adapter-arazzo'

export default defineConfig({
  input: './workflows.arazzo.yaml',
  output: {
    path: './src/gen',
  },
  adapter: adapterArazzo(),
})
```

`input` accepts a file path, a URL, an inline JSON or YAML string, or a parsed document object. A
`sourceDescriptions` URL is resolved against the Arazzo document's own location, so inline input
needs absolute source URLs.

## How a workflow maps to the AST

One workflow becomes one operation with `protocol: 'arazzo'` and no `method` or `path`:

| Arazzo                   | AST                                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| `workflows[].workflowId` | `operation.operationId`                                                  |
| `workflows[].inputs`     | schema `<Workflow>Inputs`, referenced by the operation's request body    |
| `workflows[].outputs`    | schema `<Workflow>Outputs`, referenced by the operation's `200` response |
| `workflows[].steps`      | `operation.steps`, with runtime expressions kept as written              |
| `components.inputs`      | one named schema per entry                                               |

Output types come from resolving each runtime expression: `$response.body#/token` narrows to the
`token` property of the step's success response, and `$steps.login.outputs.token` follows through to
whatever that step's output resolves to. An expression this adapter cannot follow (a Selector
Object, a JSONPath, a step whose operation no source description defines) resolves to `unknown`.

## API

### `adapterArazzo(options?)`

Creates the Arazzo adapter instance. Pass it as `adapter` in `defineConfig`.

- `validate` (default `true`) checks workflow and step ids and what each step points at before parsing.
- `contentType` picks the media type to read from a referenced operation when it declares several.
- The `@kubb/ast` parser options (`dateType`, `integerType`, `unknownType`, `emptySchemaType`, `enumSuffix`) apply to every schema this adapter converts.

### `adapterArazzoName`

The adapter's name, `'arazzo'`. Use it to identify this adapter in a Kubb config.

### Types

The package exports the Arazzo document types it works with: `ArazzoDocument`, `WorkflowObject`,
`StepObject`, `ParameterObject`, `CriterionObject`, `RequestBodyObject`, `ReusableObject`,
`SelectorObject`, `SourceDescriptionObject`, `ComponentsObject`, and `RuntimeExpression`. Its node
and option types are `ArazzoOperationNode`, `StepMeta`, `AdapterArazzo`, `AdapterArazzoOptions`, and
`AdapterArazzoResolvedOptions`.

## Limitations

- Only `openapi` source descriptions are read. An `asyncapi` or `arazzo` entry is reported and skipped, and so are `channelPath` steps.
- A step's `workflowId` is recorded but a workflow in another document is not loaded.
- `$workflows.<id>.…` expressions and Selector Objects resolve to `unknown`.
- Runtime expressions are carried, never evaluated. Executing a workflow is a plugin's job.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/adapter-arazzo.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/adapter-arazzo
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/adapter-arazzo.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/adapter-arazzo
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/adapter-arazzo.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/adapter-arazzo.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/adapter-arazzo
