import type { defineConfig, KubbUserConfig } from '@kubb/core'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | KubbUserConfig
}
