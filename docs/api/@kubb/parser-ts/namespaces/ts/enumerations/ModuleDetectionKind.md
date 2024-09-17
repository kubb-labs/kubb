[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / ModuleDetectionKind

# ModuleDetectionKind

## Enumeration Members

### Auto

```ts
Auto: 2;
```

Legacy, but also files with jsx under react-jsx or react-jsxdev and esm mode files under moduleResolution: node16+

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6896

***

### Force

```ts
Force: 3;
```

Consider all non-declaration files modules, regardless of present syntax

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6900

***

### Legacy

```ts
Legacy: 1;
```

Files with imports, exports and/or import.meta are considered modules

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:6892
