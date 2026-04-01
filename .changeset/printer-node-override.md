---
"@kubb/ast": minor
"@kubb/core": minor
"@kubb/plugin-ts": minor
"@kubb/plugin-zod": minor
"@kubb/plugin-cypress": minor
---

### `@kubb/ast`

- Rename printer type exports to follow the `Printer{Suffix}` convention:
  - `TsPrinterFactory` → `PrinterTsFactory`
  - `TsPrinterNodes` → `PrinterTsNodes`
  - `TsPrinterOptions` → `PrinterTsOptions`
  - `ZodPrinterFactory` → `PrinterZodFactory`
  - `ZodPrinterNodes` → `PrinterZodNodes`
  - `ZodPrinterOptions` → `PrinterZodOptions`
  - `ZodMiniPrinterFactory` → `PrinterZodMiniFactory`
  - `ZodMiniPrinterNodes` → `PrinterZodMiniNodes`
  - `ZodMiniPrinterOptions` → `PrinterZodMiniOptions`

### `@kubb/core`

- Replace `mergeResolvers` with a single `resolver` partial override pattern. User-supplied methods are merged on top of the preset resolver via `withFallback`. Any method returning `null` or `undefined` falls back to the preset's implementation.
- Remove `composeTransformers`. Replace the `transformers: Array<Visitor>` option with a single `transformer?: Visitor`. The visitor is applied directly via `transform(node, transformer ?? {})`.
- `getPreset` now accepts `resolver?: Partial<TResolver> & ThisType<TResolver>` — use `this.default(...)` inside an override to call the preset resolver's implementation.

### `@kubb/plugin-ts`

- **Breaking:** Replace `resolvers?: Array<ResolverTs>` with `resolver?: Partial<ResolverTs> & ThisType<ResolverTs>`. Supply only the methods you want to override; all others fall back to the active preset resolver.
- **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
- Add `printer?: { nodes?: PrinterTsNodes }` — override the TypeScript output for individual schema types (e.g. render `integer` as `bigint`).

```typescript
pluginTs({
  resolver: {
    resolveName(name) {
      return `Custom${this.default(name, 'function')}`
    },
  },
  transformer: {
    schema(node) {
      return { ...node, description: undefined }
    },
  },
  printer: {
    nodes: {
      integer() {
        return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)
      },
    },
  },
})
```

### `@kubb/plugin-zod`

- **Breaking:** Replace `resolvers?: Array<ResolverZod>` with `resolver?: Partial<ResolverZod> & ThisType<ResolverZod>`.
- **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
- Add `printer?: { nodes?: PrinterZodNodes | PrinterZodMiniNodes }` — override Zod output for individual schema types (e.g. render `integer` as `z.number()`).

```typescript
pluginZod({
  resolver: {
    resolveName(name) {
      return `${this.default(name, 'function')}Schema`
    },
  },
  transformer: {
    schema(node) {
      return { ...node, description: undefined }
    },
  },
  printer: {
    nodes: {
      integer() {
        return 'z.number()'
      },
    },
  },
})
```

### `@kubb/plugin-cypress`

- **Breaking:** Replace `resolvers?: Array<ResolverCypress>` with `resolver?: Partial<ResolverCypress> & ThisType<ResolverCypress>`.
- **Breaking:** Replace `transformers?: Array<Visitor>` with `transformer?: Visitor`.
