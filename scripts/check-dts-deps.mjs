// Fails when a published `.d.ts` imports a package that its package.json does not declare.
// A strict installer such as pnpm cannot resolve such an import, so the export becomes an error type.
// Run after `pnpm build`.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join } from 'node:path'

const specifierPattern = /(?:from\s+|import\s*\(\s*|import\s+|types=)["']([^"'./][^"']*)["']/g
// JSDoc `@example` blocks hold imports that never resolve, so strip comments first (keeps `/// <reference>`)
const commentPattern = /\/\*[\s\S]*?\*\/|^\s*\/\/(?!\/ <reference).*$/gm

function toPackageName(specifier) {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function toTypesName(name) {
  return `@types/${name.startsWith('@') ? name.slice(1).replace('/', '__') : name}`
}

const problems = []

for (const dir of readdirSync('packages')) {
  const packageDir = join('packages', dir)
  const distDir = join(packageDir, 'dist')
  if (!existsSync(distDir)) continue

  const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  if (pkg.private) continue

  const declared = new Set([pkg.name, ...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies })])

  for (const file of readdirSync(distDir, { recursive: true })) {
    if (!/\.d\.[cm]?ts$/.test(file)) continue

    const source = readFileSync(join(distDir, file), 'utf8').replace(commentPattern, '')
    for (const [, specifier] of source.matchAll(specifierPattern)) {
      const name = toPackageName(specifier)
      if (specifier.startsWith('node:') || builtinModules.includes(name)) continue
      if (declared.has(name) || declared.has(toTypesName(name))) continue

      problems.push(`${pkg.name}: ${join(distDir, file)} imports "${specifier}", which is not in dependencies or peerDependencies`)
    }
  }
}

if (problems.length) {
  console.error([...new Set(problems)].join('\n'))
  process.exit(1)
}

console.log('Every published .d.ts import is a declared dependency')
