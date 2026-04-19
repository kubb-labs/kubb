import { readdirSync } from 'node:fs'
import { spawn } from 'node:child_process'

/**
 * Collects all files under `dir` recursively using Node's built-in fs APIs.
 *
 * Passing explicit file paths to oxlint (instead of a directory) bypasses
 * oxlint's `.gitignore`-aware directory traversal, which would otherwise skip
 * files that are listed in `.gitignore` (e.g. generated output directories).
 */
function findLintableFiles(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true, recursive: true })
      .filter((d) => d.isFile())
      .map((d) => `${d.parentPath}/${d.name}`)
  } catch {
    return []
  }
}

/**
 * CLI command descriptors for each supported linter.
 *
 * Each entry contains the executable `command`, an `args` factory that maps an
 * output path to the correct argument list, and an `errorMessage` shown when
 * the linter is not found.
 */
export const linters = {
  eslint: {
    command: 'eslint',
    args: (outputPath: string) => [outputPath, '--fix'],
    errorMessage: 'Eslint not found',
  },
  biome: {
    command: 'biome',
    args: (outputPath: string) => ['lint', '--fix', outputPath],
    errorMessage: 'Biome not found',
  },
  oxlint: {
    command: 'oxlint',
    // Pass files explicitly so oxlint lints them regardless of .gitignore rules.
    // Oxlint skips files matched by .gitignore during directory traversal, which
    // causes "No files found to lint" for generated output dirs that are gitignored.
    args: (outputPath: string) => ['--fix', ...findLintableFiles(outputPath)],
    errorMessage: 'Oxlint not found',
  },
} as const

type Linter = keyof typeof linters

async function isLinterAvailable(linter: Linter): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(linter, ['--version'], { stdio: 'ignore' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Detects the first available linter on the current system.
 *
 * - Checks in preference order: `oxlint`, `biome`, `eslint`.
 * - Returns `null` when none are found.
 *
 * @example
 * ```ts
 * const linter = await detectLinter()
 * if (linter) {
 *   console.log(`Using ${linter} for linting`)
 * }
 * ```
 */
export async function detectLinter(): Promise<Linter | null> {
  const linterNames = new Set(['oxlint', 'biome', 'eslint'] as const)

  for (const linter of linterNames) {
    if (await isLinterAvailable(linter)) {
      return linter
    }
  }

  return null
}
