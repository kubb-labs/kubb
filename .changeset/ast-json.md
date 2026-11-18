---
'@kubb/ast': patch
---

Add `ast.json.stringify` and `ast.json.parse` to cache a parsed spec or send it to another thread or process.

- `ast.json.stringify(input)` writes every schema a ref points at once. A plain `JSON.stringify(input)` writes it again at every ref, which made a 618-schema spec 76 MB instead of 10 MB.
- `ast.json.parse(text)` returns the `InputNode`, with refs to one schema sharing one object again.

```ts
import { ast } from 'kubb/kit'

const text = ast.json.stringify(input)
const restored = ast.json.parse(text)
```
