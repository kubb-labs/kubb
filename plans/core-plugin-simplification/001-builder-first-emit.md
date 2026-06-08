# 001, builder-first emit path

## Context

Generators emit through JSX that the sync renderer lowers into `ConstNode`, `TypeNode`, and `FileNode`. Those same nodes can be built directly with the `create*` factories already exported from `@kubb/ast`, which removes the JSX hop for generators that do not need composition. This slice proves the builder path covers a real generator and produces identical output, which de-risks removing the reconciler in slice 002.

## Goal (demonstrable outcome)

One self-contained generator, for example the aggregate operations file in `@kubb/plugin-ts` or `@kubb/plugin-zod`, returns `FileNode[]` built with `create*` and emits a byte-identical file, and that generator module imports nothing from `@kubb/renderer-jsx`.

## Prerequisites

None.

## Steps

1. Confirm the `@kubb/ast` `create*` factories cover the constructs the chosen generator needs: const, type, function, source, import, export, and text. Add a thin convenience factory in `@kubb/ast` only if a construct is missing.
2. Reimplement the chosen generator to return builder output instead of JSX, and rename the file from `.tsx` to `.ts`.
3. Run that plugin's snapshots and confirm the output is unchanged.
4. Write a short note that captures the builder-versus-JSX choice for the slice 005 documentation.

## Files touched

- the chosen generator, `*.tsx` deleted and `*.ts` created (plugins repo)
- `packages/ast/src/factory.ts` (modified, only if a factory is missing)
- a changeset for any `@kubb/ast` addition

## Verification

1. `pnpm --filter @kubb/plugin-ts test` (or the chosen plugin) passes with snapshots unchanged.
2. The generator module shows no `@kubb/renderer-jsx` import.
3. The wider snapshot suite is unchanged.

## Done criteria

- [ ] One generator emits identical output through the builder API
- [ ] That generator module has no JSX runtime import
- [ ] Any `@kubb/ast` addition has a changeset
