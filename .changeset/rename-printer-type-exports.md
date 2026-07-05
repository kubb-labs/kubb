---
"@kubb/ast": minor
"@kubb/core": minor
---

Rename printer type exports and simplify resolver/transformer APIs.

### `@kubb/ast`

Printer type exports now follow `Printer{Suffix}` convention:
- `TsPrinterFactory` → `PrinterTsFactory`
- `TsPrinterNodes` → `PrinterTsNodes`
- `ZodPrinterFactory` → `PrinterZodFactory`
- `ZodPrinterNodes` → `PrinterZodNodes`

### `@kubb/core`

- Replace `mergeResolvers` with a single `resolver` partial override pattern using `withFallback`
- Replace `transformers: Array<Visitor>` with a single `transformer?: Visitor`
- `getPreset` accepts `resolver?: Partial<TResolver>`. Use `this.core.name(...)` / `this.core.typeName(...)` to call the preset implementation
