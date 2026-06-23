---
'@kubb/core': minor
---

Let `ctx.addGenerator` register several generators in one call. Pass them as separate arguments (`ctx.addGenerator(schemaGenerator, operationGenerator)`) or hand it an existing list (`ctx.addGenerator(selectedGenerators)`), and the arrays are flattened for you. A single generator still works as before, so there is no need to loop over each one.
