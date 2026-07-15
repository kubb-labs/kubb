---
'kubb': major
'unplugin-kubb': major
---

Flip the default `output.barrel` from `{ type: 'named' }` to `false`. A config that omits `output.barrel` (root or per-plugin) no longer generates a barrel `index.ts` file.

Set `output.barrel: { type: 'named' | 'all' }` explicitly to keep generating a barrel.

**Breaking change:** any project relying on the implicit `{ type: 'named' }` default to get a barrel now needs `output.barrel` set explicitly, or imports that go through the barrel (`import { Pet } from './gen'`) stop resolving.
