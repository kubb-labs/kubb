# Options

`parserTs` and `parserTsx` accept the same single option, `extension`, which rewrites the import and export extensions the TypeScript parser emits.

## Options overview

| Option                    | Purpose                                                         | Default         |
| ------------------------- | --------------------------------------------------------------- | --------------- |
| [`extension`](#extension) | Rewrite the extensions emitted in `import`/`export` statements. | `{ '.ts': '' }` |

## Option details

### extension

Rewrites the extensions emitted in relative `import`/`export` statements. Each key is the extension of a generated file, and its value is the extension written on the relative specifiers in that file. `''` drops it, and so does a generated file whose extension has no key. Package specifiers and the on-disk filenames never change.

Use `{ '.ts': '.js' }` to emit `.js` specifiers for ESM output compiled to JavaScript. Use `{ '.ts': '.ts' }` to keep `.ts` specifiers when you run the `.ts` files directly in Node.js or compile them with `rewriteRelativeImportExtensions`.

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
