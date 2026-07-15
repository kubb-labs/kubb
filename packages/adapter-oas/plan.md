# adapter-oas: leaner shape

An implementation plan for reshaping `@kubb/adapter-oas` into three phases with an
immutable intermediate model. Behavior stays identical. The goal is to reduce
coupling and the number of contracts a reader has to hold at once.

## Summary

Today `parse()` loads, dereferences, names, and builds AST in a single pass that
mutates the document as it goes. This plan splits that work into `Load`, `Model`,
and `Emit`, with a resolved `SpecModel` handed from `Model` to `Emit` so the AST
layer never touches the raw document. Along the way it collapses six `$ref`
resolvers into one, moves the discriminator logic behind a strategy, splits the
769-line `converters.ts` by node family, and reduces six caches to two.

This is a reshaping, not a rewrite. The total line count barely moves. Every output
stays the same, the public types stay the same, and the options stay the same.

## Non-goals

- No change to the emitted `InputNode`, the public types, or the adapter options.
- No new runtime dependency.
- No behavior change that a test would notice. If a test has to change, treat that
  as a signal to stop and reconsider the slice.

## Guardrails

Run the full check after every slice and keep it green before moving on:

```bash
pnpm --filter @kubb/adapter-oas lint
pnpm --filter @kubb/adapter-oas typecheck
pnpm --filter @kubb/adapter-oas test
```

Work one slice per commit so review stays small and a bad step is easy to revert.
Use `git mv` for pure moves so history follows the code. The test suite is the
safety net here: roughly 6,181 lines of tests against 3,034 lines of source, about
two to one.

### Baseline before starting

1. Confirm the suite is green on a clean tree.
2. Snapshot the parsed `InputNode` for a few fixtures under `mocks/`
   (`petStore.yaml`, `withExternalFileRef.yaml`, `withFragmentRef.yaml`) and keep
   the snapshots. After each slice, assert the parsed output is byte-identical to
   the baseline. This is the characterization test that guards the whole refactor.
3. Record a baseline for `src/adapter.bench.ts` so the ref-cache changes can be
   checked for regressions later.

## Current state

The package is 14 flat files. The trouble spots this plan targets:

1. Six overlapping `$ref` resolvers: `resolveRef`, `dereferenceWithRef`,
   `derefInPlace` (`refs.ts`), `resolveRefNode` and `refExists` (`parser.ts`),
   `resolveRefSilent` (inside `convertUnion`), and `resolveSchemaRef`
   (`resolvers.ts`).
2. `converters.ts` is 769 lines, a quarter of the package in one file.
3. Discriminator logic lives in three places: `converters.ts`, `discriminator.ts`,
   and the wiring in `adapter.ts`.
4. Resolvers mutate the shared document in place (`derefInPlace`,
   `getRequestSchema`, `getRequestBodyContentTypes`, `resolveResponseRefs`).
5. The fall-through rule contract (`match` true, `convert` returns `null`) is used
   by only 2 of the 17 rules.
6. `buildSchemaNode` is spread into about a dozen converters.

## Target structure

```
src/
  adapter.ts          # public factory, wires Load -> Model -> Emit, one cache
  index.ts
  types.ts

  load/               # PHASE A: source -> normalized Document
    source.ts         #   read, fetch, parse            (from factory.ts)
    normalize.ts      #   bundle, upgrade, validate      (from factory.ts)

  model/              # PHASE B: Document -> immutable SpecModel
    components.ts     #   collect schemas, name, sort    (from resolvers.ts)
    operations.ts     #   params, request, response      (from operation.ts + resolvers.ts)
    server.ts         #   baseURL                        (from resolvers.ts)
    specModel.ts      #   the IR types and its builder   (new)

  emit/               # PHASE C: pure SpecModel -> InputNode
    parseSchema.ts    #   the ordered rule table         (from parser.ts)
    createNode.ts     #   folds buildSchemaNode          (new)
    converters/
      composition.ts  #   ref, allOf, oneOf/anyOf, multi-type
      scalar.ts       #   string, number, boolean, enum, const, format, binary, null
      structural.ts   #   object, array, tuple
    discriminator/
      index.ts        #   strategy selector              (new)
      preserve.ts     #   inline narrowing               (from converters.ts)
      propagate.ts    #   post-pass child map            (from discriminator.ts)
    promoteEnums.ts   #   enums: root                    (unchanged)
    diagnostics.ts    #   deprecated, unsupported format (from schemaDiagnostics.ts)

  refs.ts             # one Refs service: resolve() + refName()
  oas.ts              # predicates (unchanged)
  constants.ts        # defaults, formatMap (unchanged)
```

## Slices

Ordered low-risk first, so the mechanical splits land before the one change that
reshapes the data flow. Each slice is behavior-preserving on its own.

### Slice 01: extract `createNode`

Closes finding 6. Nearly every converter ends with
`...buildSchemaNode(schema, name, nullable, defaultValue)` plus its own fields,
then calls `ast.factory.createSchema`. Fold that into one helper.

1. Add `createNode(type, ctx, extras)` that reads `schema`, `name`, `nullable`,
   and `defaultValue` from the convert context and returns the built node.
2. Replace the `buildSchemaNode` spread in each converter with a `createNode`
   call.
3. Keep `buildSchemaNode` for now if any caller outside the converters still needs
   it, otherwise inline and remove it.

Done when:

- [ ] Every converter builds through `createNode`.
- [ ] The `InputNode` snapshots are unchanged.
- [ ] Lint, typecheck, and tests are green.

Risk is low and the change is mechanical.

### Slice 02: split `converters.ts` by node family

Closes finding 2. The ordered `schemaRules` table stays as the single dispatch
index. Only the converter functions move.

1. Create `emit/converters/composition.ts` (`convertRef`, `convertAllOf`,
   `convertUnion`, `convertMultiType`), `emit/converters/scalar.ts`
   (`convertConst`, `convertFormat`, `convertEnum`, `convertString`,
   `convertNumeric`, `convertBoolean`, `convertBinary`, and the `null` builder),
   and `emit/converters/structural.ts` (`convertObject`, `convertArray`,
   `convertTuple`).
2. Keep the shared helpers (`normalizeArrayEnum`, `createNullNode`, `nameEnums`)
   next to the converters that use them.
3. Keep `schemaRules` in `emit/parseSchema.ts`, importing each converter from its
   new file.

Done when:

- [ ] `converters.ts` no longer exists, its content lives under `emit/converters/`.
- [ ] `parseSchema.ts` imports the same rule order as before.
- [ ] Snapshots unchanged, checks green.

Risk is low. This is a move, not a logic change.

### Slice 03: tighten the two fall-through rules

Closes finding 5. Only `convertFormat` and `convertMultiType` return `null` to
defer. Make their `match` predicates fully decide, then drop `| null` from the
converter return type.

1. Change the `format` rule's `match` to fire only when the format actually maps
   to a node: check `isHandledFormat(schema.format)` and the relevant `dateType`
   option. When it does not, let the plain type rules handle it.
2. Change the multi-type rule's `match` to fire only when more than one non-`null`
   type remains, so `convertMultiType` never returns `null`.
3. Remove the `| null` from `SchemaRule['convert']` and the two converter
   signatures.

Done when:

- [ ] No converter returns `null`.
- [ ] `SchemaRule['convert']` returns `SchemaNode`.
- [ ] Snapshots unchanged, checks green.

Risk is low, but the format predicate needs care so a format that used to fall
through still falls through.

### Slice 04: one Refs service

Closes finding 1. Collapse the read-only resolvers into a single service. Leave
the in-place mutation (`derefInPlace`) alone for now, it is removed in slice 07.

1. Add `createRefs(document)` in `refs.ts` returning `{ resolve, resolveNode,
   exists, refName }`. Fold `resolveRef`, `dereferenceWithRef`, `resolveRefNode`,
   `refExists`, `resolveRefSilent`, and `resolveSchemaRef` into it, with the ref
   memo and cycle guard living inside the service.
2. Give it one explicit contract for a missing ref, and a `report` flag so the
   silent lookup inside `convertUnion` stops being a second implementation.
3. Migrate call sites one at a time, running the suite between each.

Done when:

- [ ] `resolveRefSilent`, `resolveSchemaRef`, `resolveRefNode`, and `refExists` are
      gone, replaced by the service.
- [ ] The parser and converters take the service, not loose helpers.
- [ ] Snapshots unchanged, checks green, bench shows no regression.

Risk is medium. The return contracts differ today (null vs throw vs keep the
`$ref`), so reconcile them deliberately.

### Slice 05: discriminator as a strategy

Closes finding 3. Put `preserve` and `propagate` behind one interface, selected
once.

1. Define a `DiscriminatorStrategy` in `emit/discriminator/index.ts`.
2. Move the inline `preserve` narrowing (`implicitDiscriminantValue`,
   `pickDiscriminatorPropertyNode`, and the shared-properties handling in
   `convertUnion`, plus the `filteredDiscriminantValues` path in `convertAllOf`)
   into `preserve.ts`.
3. Move `buildDiscriminatorChildMap` and `patchDiscriminatorNode` from
   `discriminator.ts` into `propagate.ts`.
4. Have the union and allOf converters call the selected strategy instead of
   carrying the branching themselves.

Done when:

- [ ] The union and allOf converters hold no discriminator branching.
- [ ] Both modes read side by side under `emit/discriminator/`.
- [ ] Snapshots unchanged for both `preserve` and `propagate`, checks green.

Risk is medium. Cover both modes with the existing discriminator tests before and
after.

### Slice 06: carve `resolvers.ts` into `model/` and `load/`

`resolvers.ts` carries four concerns. Split them by phase.

1. Move `getSchemas`, `sortSchemas`, `collectRefs`, and the collision naming into
   `model/components.ts`.
2. Move `getParameters`, `getRequestSchema`, `getResponseSchema`, and the
   content-type helpers into `model/operations.ts`, next to the current
   `operation.ts`.
3. Move `resolveBaseUrl` and `resolveServerUrl` into `model/server.ts`.
4. Move the schema helpers (`flattenSchema`, `getDateType`, `getSchemaType`,
   `getPrimitiveType`, `isHandledFormat`, `extractExamples`) into `emit/`.
5. Move `factory.ts` into `load/`, splitting read and parse from bundle, upgrade,
   and validate.

Done when:

- [ ] `resolvers.ts` no longer exists.
- [ ] Each moved function lives in the folder that matches its phase.
- [ ] Snapshots unchanged, checks green.

Risk is medium, mostly from the volume of import updates.

### Slice 07: SpecModel and a pure emit

Closes finding 4. This is the change that reshapes the data flow, so it goes last.

1. Define `SpecModel` in `model/specModel.ts`: a resolved, immutable
   `{ schemas, operations, meta }` where every `$ref` is already resolved and named
   and every collision rename is applied.
2. Have `Model` build the `SpecModel` up front, resolving refs through the Refs
   service instead of dereferencing in place. Remove `derefInPlace`,
   `resolveResponseRefs`, and the `operation.schema.requestBody` mutation.
3. Make `Emit` a pure function from `SpecModel` to `InputNode` with no document
   access.
4. Collapse the caches. Keep one `source -> Promise<InputNode>` cache in
   `adapter.ts` and the ref memo inside the Refs service. Drop `schemasCache` and
   `schemaParserCache`, since the pipeline now runs once per source.

Done when:

- [ ] No code mutates the source document.
- [ ] `Emit` takes only a `SpecModel`.
- [ ] Two caches remain.
- [ ] Snapshots unchanged, checks green, bench shows no regression.

Risk is the highest of the set. Land it on top of the now-clean pieces and lean on
the snapshots.

## Verification

Every slice is guarded the same way:

1. The `InputNode` snapshots for the `mocks/` fixtures stay byte-identical.
2. `pnpm --filter @kubb/adapter-oas lint typecheck test` stays green.
3. `src/adapter.bench.ts` stays within noise of the baseline, with extra attention
   on slices 04 and 07 where the ref caching moves.

If a slice needs a real test change, stop. A behavior-preserving refactor should
not, and a required change means the slice is doing more than it claims.

## Follow-up, out of scope here

Holding more than one input format against this structure shows that `emit/` and
`refs.ts` are not OpenAPI-specific, they turn a JSON Schema into an AST node and
resolve pointers. That job is identical for an AsyncAPI or Arazzo adapter. Once
this refactor lands, a natural next step is to lift `emit` and `refs` into
`@kubb/kit` so future adapters reuse them and each adapter is just its own `load/`
and `model/`. That is a separate, cross-package change and is not part of this
plan.
