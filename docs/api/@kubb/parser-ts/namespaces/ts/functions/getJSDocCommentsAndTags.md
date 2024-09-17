[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / getJSDocCommentsAndTags

# getJSDocCommentsAndTags()

```ts
function getJSDocCommentsAndTags(hostNode): readonly (JSDoc | JSDocTag)[]
```

This function checks multiple locations for JSDoc comments that apply to a host node.
At each location, the whole comment may apply to the node, or only a specific tag in
the comment. In the first case, location adds the entire [JSDoc](../interfaces/JSDoc.md) object. In the
second case, it adds the applicable [JSDocTag](../interfaces/JSDocTag.md).

For example, a JSDoc comment before a parameter adds the entire [JSDoc](../interfaces/JSDoc.md). But a
`@param` tag on the parent function only adds the [JSDocTag](../interfaces/JSDocTag.md) for the `@param`.

```ts
/** JSDoc will be returned for `a` */
const a = 0
/**
 * Entire JSDoc will be returned for `b`
 * @param c JSDocTag will be returned for `c`
 */
function b(/** JSDoc will be returned for `c` */ c) {}
```

## Parameters

• **hostNode**: [`Node`](../interfaces/Node.md)

## Returns

readonly ([`JSDoc`](../interfaces/JSDoc.md) \| [`JSDocTag`](../interfaces/JSDocTag.md))[]

## Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:8783
