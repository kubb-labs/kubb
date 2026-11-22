---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/kit': patch
---

Add `setPrinter` to `@kubb/kit`, so a plugin registers its printer in `setup` and generators read it as `ctx.printer`.

- Kit builds the printer once per build and once per matching `override`.
- `printer.with(extra)` returns the printer with `extra` merged over its options.
- `PluginType` takes the printer type as its fifth parameter.

`printer.print(node)` and `printer.transform(node)` no longer take options:

```diff
- printer.print(node, { optionalType })
+ printer.with({ optionalType }).print(node)
```
