---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/studio': patch
---

`InputMeta.circularNames` and `InputMeta.enumNames` are now `ReadonlySet<string>` instead of arrays, so a generator calls `ctx.meta.enumNames.has(name)` without building its own set. Code that reads them as arrays needs `.has` instead of `.includes`, `.size` instead of `.length`, and `[...meta.enumNames]` for array methods. `new Set(meta.enumNames)` keeps working. This includes `banner` and `footer` functions, whose `BannerMeta` extends `InputMeta`. Kubb Studio still stores and sends both fields as arrays.
