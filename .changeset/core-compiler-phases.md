---
"@kubb/core": patch
---

Internal refactor: split the driver into explicit `Parse`, `Transform`, and `Generate` phase classes under `packages/core/src/compiler/`. The transform step, previously inlined in `KubbDriver.#runGenerators`, is now a per-plugin visitor registry that the generate phase reads through `transforms.applyTo`. Behavior, the public surface (`setTransformer`, `plugin.transformer`, `KubbHooks`), and the `@kubb/core/mocks` entry are unchanged.
