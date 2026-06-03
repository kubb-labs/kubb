---
"@kubb/core": patch
---

Lift the per-plugin transform step into a `Transform` registry that the driver consults during dispatch, so transforms have one home and one contract instead of being inlined in `KubbDriver.#runGenerators`. The driver keeps the parse and generate logic as private methods (`#parseInput`, `#runGenerators`) and exposes the renderer-or-file dispatch as a `KubbDriver.applyResult` static so both the registered generators and `@kubb/core/mocks` route through one entry point.

Bug fix: `gen.operations(nodes, ctx)` and the `kubb:generate:operations` hook now receive the transformed nodes, matching what `gen.operation(node, ctx)` already received per-node. Before this fix the aggregated callback saw the original adapter nodes, so a renaming-transformer would feed grouped or barrel generators a different shape than the per-operation hook saw.

The flush-after-batch logic that used to live as a closure inside `KubbDriver.run` moved into a new `FileWriteQueue` class. The class also makes the flush non-blocking: the next round of generator dispatch can run while the previous round's source rendering and storage writes are still in flight. For large specs (Stripe-sized OpenAPI documents, thousands of generated files) the pipelined flush keeps peak heap roughly the same and lets CPU work overlap with IO instead of running behind it.

The public surface (`setTransformer`, `KubbHooks`, the `KubbDriver` class, the `@kubb/core/mocks` entry) is unchanged.
