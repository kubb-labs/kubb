# Options

`parserTs` and `parserTsx` accept the same single option, `extension`, which rewrites the import and export extensions the TypeScript parser emits.

## Options overview

| Option                    | Purpose                                                         | Default         |
| ------------------------- | --------------------------------------------------------------- | --------------- |
| [`extension`](#extension) | Rewrite the extensions emitted in `import`/`export` statements. | `{ '.ts': '' }` |

## Option details

### extension

Rewrites the extensions emitted in `import`/`export` statements. Keys are the source extension, values the output, and `''` drops it. Only the module-specifier string changes, never the on-disk filename.

Use it to emit `.js` imports from `.ts` sources for an ESM dual package, or to keep the source extension for Node16/NodeNext resolution.

The same mapping applies to runtime templates a plugin copies into the output, such as the `.kubb/` runtime files of `@kubb/plugin-fetch`. Their top-level `import` and `export … from` statements become import and export nodes, so the whole output follows one convention.

|          |                          |
| -------- | ------------------------ |
| Type     | `Record<string, string>` |
| Required | `false`                  |
| Default  | `{ '.ts': '' }`          |

```typescript
parserTs({ extension: { '.ts': '.js' } }) // import './api.js' instead of './api'
parserTs({ extension: { '.ts': '.ts' } }) // import './api.ts' instead of './api'
```
