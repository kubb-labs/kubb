---
'@kubb/ast': minor
'@kubb/core': minor
---

Rename printer type exports and simplify resolver/transformer APIs.

### `@kubb/ast`

Printer type exports now follow `Printer{Suffix}` convention:

- `TsPrinterFactory` → `PrinterTsFactory`
- `TsPrinterNodes` → `PrinterTsNodes`
- `ZodPrinterFactory` → `PrinterZodFactory`
- `ZodPrinterNodes` → `PrinterZodNodes`

### `@kubb/core`

- Replace `mergeResolvers` with single `resolver` partial override pattern using `withFallback`
- Replace `transformers: Array<Visitor>` with single `transformer?: Visitor`
- `getPreset` accepts `resolver?: Partial<TResolver>` — use `this.default(...)` to call preset implementation
