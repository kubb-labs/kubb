import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import createJiti from 'jiti'

export function resolveModuleSource(pkgName: string) {
  const parentURL = import.meta.url
  const jiti = createJiti(parentURL)

  const resolved = jiti.esmResolve(pkgName, parentURL)
  const filePath = resolved.startsWith('file:') ? fileURLToPath(resolved) : resolved
  const source = readFileSync(filePath, { encoding: 'utf-8' })
  const ext = path.extname(filePath)
  return { path: filePath, source, ext } as const
}
