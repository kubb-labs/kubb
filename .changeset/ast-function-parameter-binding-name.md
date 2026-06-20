---
'@kubb/ast': patch
---

Let `createFunctionParameter` accept a pre-built `ObjectBindingPatternNode` as its `name`.

The `name`-form input now takes `string | ObjectBindingPatternNode`, so a destructured group that is typed from a single reference (or carries no type) can go through the factory instead of a hand-built `{ kind: 'FunctionParameter' }` literal, for example `createFunctionParameter({ name: createObjectBindingPattern({ elements: [{ name: 'path' }] }), type: "Omit<Config, 'url'>", default: '{}' })`. The `FunctionParameterNode` shape is unchanged.
