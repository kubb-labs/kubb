---
"@kubb/core": patch
---

Split the driver into explicit `Parse`, `Transform`, and `Generate` phase classes under `packages/core/src/compiler/`. The transform step, previously inlined in `KubbDriver.#runGenerators`, is now a per-plugin visitor registry that the generate phase reads through `transforms.applyTo`. Adapter parsing also moved out of `setup()` and into `KubbDriver.run()`, so the parse, transform, and generate sequence is visible in one place.

Bug fix: `gen.operations(nodes, ctx)` and the `kubb:generate:operations` hook now receive the transformed nodes, matching what `gen.operation(node, ctx)` already received per-node. Before this fix the aggregated callback saw the original adapter nodes, so a renaming-transformer would feed grouped or barrel generators a different shape than the per-operation hook saw.

The flush-after-batch logic that used to live as a closure inside `KubbDriver.run` moved into a new `FileWriteQueue` class. The class also makes the flush non-blocking: the next round of generator dispatch can run while the previous round's source rendering and storage writes are still in flight. For large specs (Stripe-sized OpenAPI documents, thousands of generated files) the pipelined flush keeps peak heap roughly the same and lets CPU work overlap with IO instead of serialising behind it.

The public surface (`setTransformer`, `KubbHooks`, the `KubbDriver` class, the `@kubb/core/mocks` entry) is unchanged.
