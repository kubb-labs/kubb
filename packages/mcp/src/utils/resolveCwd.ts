import path from 'node:path'
import type { Config } from '@kubb/core'

/**
 * Determine the root directory based on userConfig.root and resolvedConfigDir
 * 1. If userConfig.root exists and is absolute, use it as-is
 * 2. If userConfig.root exists and is relative, resolve it relative to config directory
 * 3. Otherwise, use the config directory as root
 */
export function resolveCwd(userConfig: Config, cwd: string): string {
  if (userConfig.root) {
    if (path.isAbsolute(userConfig.root)) {
      return userConfig.root
    }

    return path.resolve(cwd, userConfig.root)
  }

  return cwd
}
