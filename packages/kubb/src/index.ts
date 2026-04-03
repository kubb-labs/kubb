// Register built-in config presets (e.g. 'oas-typescript') into the core registry.
// This must be a side-effect import so the registry is populated whenever the kubb
// meta-package is loaded — by the CLI, by programmatic usage, or by tests.
import './configPresets.ts'

export * from '@kubb/core'
