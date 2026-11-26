import { createKubb as createCoreKubb, type KubbOptions, type Kubb, type UserConfig } from '@kubb/core'
import { defineConfig } from './defineConfig.ts'

/**
 * Creates a Kubb instance with the same defaults as `defineConfig`.
 */
export function createKubb(userConfig: UserConfig, options?: KubbOptions): Kubb {
  return createCoreKubb(defineConfig(userConfig), options)
}
