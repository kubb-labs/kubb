---
'kubb': patch
---

`defineConfig` now reports unknown keys. Each config shape (object, array, Promise, function) has its own overload, so a misspelled option such as `output.cleen` fails the typecheck instead of being ignored at generation time. Return types are unchanged.

TypeScript does not check excess keys on a value returned from a callback or wrapped in a Promise, so the function and Promise forms still accept unknown keys. Add `satisfies UserConfig` to the returned object when you want that check there.
