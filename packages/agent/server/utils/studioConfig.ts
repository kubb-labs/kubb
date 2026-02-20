import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { JSONKubbConfig } from '~/types/agent.ts'

/**
 * Reads the temporal studio config file and returns its contents, or `null`
 * when the file does not exist.
 */
export function readStudioConfig(configPath: string): JSONKubbConfig | null {
  const studioConfigPath = path.join(path.dirname(configPath), 'kubb.config.studio.json')

  if (!existsSync(studioConfigPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(studioConfigPath, 'utf-8')) as JSONKubbConfig
  } catch {
    return null
  }
}

/**
 * Writes a {@link JSONKubbConfig} patch to the temporal studio config file.
 * Only JSON-string values are supported.
 */
export function writeStudioConfig(configPath: string, config: JSONKubbConfig): void {
  const studioConfigPath = path.join(path.dirname(configPath), 'kubb.config.studio.json')

  writeFileSync(studioConfigPath, JSON.stringify(config, null, 2), 'utf-8')
}
