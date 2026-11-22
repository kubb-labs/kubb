---
'@kubb/core': patch
'@kubb/kit': patch
---

`PluginType` from `@kubb/core` takes only the name, options and resolved options. Import it from `@kubb/kit` to also pass the resolver and printer.

```diff
- import type { PluginType } from '@kubb/core'
+ import type { PluginType } from '@kubb/kit'

  type PluginTs = PluginType<'plugin-ts', Options, ResolvedOptions, ResolverTs>
```
