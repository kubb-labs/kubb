[API](../../../../../packages.md) / [@kubb/parser-ts](../../../index.md) / [ts](../index.md) / PackageId

# PackageId

Unique identifier with a package name and version.
If changing this, remember to change `packageIdIsEqual`.

## Properties

### name

```ts
name: string;
```

Name of the package.
Should not include `@types`.
If accessing a non-index file, this should include its name e.g. "foo/bar".

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7228

***

### subModuleName

```ts
subModuleName: string;
```

Name of a submodule within this package.
May be "".

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7233

***

### version

```ts
version: string;
```

Version of the package, e.g. "1.2.3"

#### Defined in

node\_modules/.pnpm/typescript@5.6.2/node\_modules/typescript/lib/typescript.d.ts:7235
