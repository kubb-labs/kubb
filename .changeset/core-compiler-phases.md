---
"@kubb/core": patch
---

Split the driver into explicit `Parse`, `Transform`, and `Generate` phase classes under `packages/core/src/compiler/`. The transform step, previously inlined in `KubbDriver.#runGenerators`, is now a per-plugin visitor registry that the generate phase reads through `transforms.applyTo`. All three phases now run inside `KubbDriver.run()` — adapter parsing moved out of `setup()` so the parse-transform-generate sequence is visible in one place.

Bug fix: `gen.operations(nodes, ctx)` and the `kubb:generate:operations` hook now receive the transformed nodes, matching what `gen.operation(node, ctx)` already received per-node. Previously the aggregated callback got the original adapter nodes, so a renaming-transformer would feed grouped/barrel generators a different shape than the per-operation hook saw.

The public surface (`setTransformer`, `KubbHooks`, the `KubbDriver` class, the `@kubb/core/mocks` entry) is unchanged.
