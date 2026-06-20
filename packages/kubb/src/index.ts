export * from '@kubb/core'
// `defineConfig` is re-exported here so importing it from `kubb` (the recommended
// v5 entrypoint) does not carry the deprecation attached to the `@kubb/core` export.
export { defineConfig } from './defineConfig.ts'
