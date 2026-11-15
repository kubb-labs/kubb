# Options

`parserTs()` and `parserTsx()` take one option, `extension`, which sets the extension on the relative imports and exports they write.

## Options overview

| Option                    | Purpose                                                         | Default         |
| ------------------------- | --------------------------------------------------------------- | --------------- |
| [`extension`](#extension) | Extension written on relative `import` and `export` specifiers. | `{ '.ts': '' }` |

## Option details

### extension

Maps the extension of a generated file to the extension its relative specifiers get. `''` drops the extension, and so does a file whose extension has no key. The map only replaces an extension: a relative specifier without one stays as written. Package specifiers and the file names on disk never change.

|          |                          |
| -------- | ------------------------ |
| Type     | `Record<string, string>` |
| Required | `false`                  |
| Default  | `{ '.ts': '' }`          |

| Value                     | Writes              | Use it when                                                                                   |
| ------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `{ '.ts': '' }` (default) | `import './api'`    | A bundler or `moduleResolution: 'bundler'` resolves the files.                                |
| `{ '.ts': '.js' }`        | `import './api.js'` | You compile the output to ESM JavaScript.                                                     |
| `{ '.ts': '.ts' }`        | `import './api.ts'` | Node.js runs the `.ts` files directly, or you compile with `rewriteRelativeImportExtensions`. |

The same map applies to runtime templates that a plugin copies into the output, such as the `.kubb/` files of `@kubb/plugin-fetch`. Their top-level `import` and `export … from` statements are rewritten too, so the whole output follows one convention.

`parserTsx` reads only its own map. Set the `.tsx` key on it, such as `parserTsx({ extension: { '.tsx': '.js' } })`.
