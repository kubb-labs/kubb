import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { kubbManifestJsonSchema } from '@kubb/core'
import type { KubbManifest } from '@kubb/core'
import { Ajv2020 } from 'ajv/dist/2020.js'
import { buildManifest } from './manifest.ts'

type BuildOptions = {
  cwd: string
  /**
   * TypeScript source entry, relative to `cwd`.
   */
  entry: string
  /**
   * Manifest path, relative to `cwd`.
   */
  out: string
  /**
   * Compare with the file at `out` instead of writing it.
   */
  check: boolean
}

/**
 * `written` after a write. With `check`, `up-to-date`, `outdated` or `missing`.
 */
export type BuildStatus = 'written' | 'up-to-date' | 'outdated' | 'missing'

/**
 * Returns one line per place where `manifest` does not match `kubbManifestJsonSchema`.
 */
export function validateManifest(manifest: KubbManifest): Array<string> {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true })
  const validate = ajv.compile(kubbManifestJsonSchema)
  if (validate(manifest)) return []

  return (validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
}

async function readCurrent(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if ((error as { code?: unknown }).code === 'ENOENT') return undefined
    throw error
  }
}

/**
 * Builds the manifest of the package in `cwd`, validates it, then writes it to `out`.
 * With `check`, sets exit code 1 when the file at `out` is missing or differs.
 */
export async function run({ cwd, entry, out, check }: BuildOptions): Promise<BuildStatus> {
  const manifest = await buildManifest({ cwd, entry })

  const errors = validateManifest(manifest)
  if (errors.length > 0) {
    throw new Error(`The manifest of ${manifest.name} does not match ${kubbManifestJsonSchema.$id}:\n${errors.map((error) => `  ${error}`).join('\n')}`)
  }

  const content = `${JSON.stringify(manifest, null, 2)}\n`
  const outPath = path.resolve(cwd, out)

  if (check) {
    const current = await readCurrent(outPath)
    if (current === content) {
      console.log(`${styleText('green', '✓')} ${out} is up to date`)
      return 'up-to-date'
    }

    process.exitCode = 1
    console.error(`${styleText('red', '✗')} ${out} is ${current === undefined ? 'missing' : 'out of date'}. Run \`kubb extension build\` to update it.`)
    return current === undefined ? 'missing' : 'outdated'
  }

  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, content)
  console.log(`${styleText('green', '✓')} Wrote ${out} with ${manifest.extensions.map(({ meta }) => meta.name).join(', ')}`)
  return 'written'
}
