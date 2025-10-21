import { useApp } from '@kubb/react'
import type { KubbFile } from '../fs/index.ts'

export function useMode(): KubbFile.Mode {
  const { meta } = useApp<{ mode: KubbFile.Mode }>()

  return meta.mode
}
