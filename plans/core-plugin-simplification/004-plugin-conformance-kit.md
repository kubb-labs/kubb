# 004, plugin conformance kit

## Context

The contract between core and a plugin, the resolver shape, the generator return types, and the file-naming rules, is implicit. The `@kubb/core/mocks` subpath exists, but each plugin tests against it ad hoc. This slice makes the contract executable, so a plugin that drifts fails fast with a clear message.

## Goal (demonstrable outcome)

One shared conformance test runs against every plugin and passes, and breaking a single plugin's resolver makes only that plugin fail.

## Prerequisites

None. Benefits from slice 003, since the kit is a natural home for the helper.

## Steps

1. Build a `pluginConformance(plugin, fixtures)` helper on `@kubb/core/mocks` using `createMockedPluginDriver`, `renderGeneratorSchema`, and `renderGeneratorOperation`. Assert that the resolver exposes the required methods with stable names, that generators return file or builder output, and that emitted paths stay within the output root.
2. Place the helper in the plugin kit or a shared test-utils internal.
3. Add the conformance test to every plugin's test file.
4. Demonstrate the red path: rename a resolver method in one plugin, watch its conformance fail, then revert.

## Files touched

- the conformance helper (created, in the plugin kit or a test-utils internal)
- each plugin `*.test.ts` (modified)
- a changeset if the helper is published

## Verification

1. `pnpm test` across the plugins shows the conformance suite green for every plugin.
2. Break a resolver method name in one plugin, confirm only that plugin's conformance fails with a readable message, then revert.

## Done criteria

- [x] The conformance suite runs for every plugin that exports a public resolver
- [x] The red path is demonstrated and reverted
- [x] The helper has a home

## Status

Shipped and validated locally (commits `221a600` and `64bca38`, plugins #319). 18 tests pass.

- `tests/conformance/resolvers.test.ts` runs the six plugins that export a public resolver (client, cypress, faker, mcp, ts, zod) against the core `Resolver` contract: the base methods exist and are callable, `resolveFile` keeps output inside the output root, and `default()` returns non-empty identifiers.
- Red path demonstrated: a resolver that drops `resolveFile` fails the contract, then reverted.
- Scope: the suite asserts the resolver contract, not generator execution. Running each plugin's generators against a fixture would largely duplicate the existing per-plugin snapshot tests, so the unique value is the uniform resolver check. The suite is an inline `describe.each` rather than a separately published helper, so no changeset.
