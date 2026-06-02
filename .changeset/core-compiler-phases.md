---
"@kubb/core": patch
---

Split the driver into explicit `Parse`, `Transform`, and `Generate` phase classes under `packages/core/src/compiler/`. The transform step, previously inlined in `KubbDriver.#runGenerators`, is now a per-plugin visitor registry that the generate phase reads through `transforms.applyTo`. Adapter parsing also moved out of `setup()` and into `KubbDriver.run()`, so the parse, transform, and generate sequence is visible in one place.

Bug fix: `gen.operations(nodes, ctx)` and the `kubb:generate:operations` hook now receive the transformed nodes, matching what `gen.operation(node, ctx)` already received per-node. Before this fix the aggregated callback saw the original adapter nodes, so a renaming-transformer would feed grouped or barrel generators a different shape than the per-operation hook saw.

The public surface (`setTransformer`, `KubbHooks`, the `KubbDriver` class, the `@kubb/core/mocks` entry) is unchanged.
