import { readSync } from '@internals/utils'
import * as pkg from 'empathic/package'

type PackageJSON = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type DependencyName = string
type DependencyVersion = string

function getPackageJSONSync(cwd?: string): PackageJSON | null {
  const pkgPath = pkg.up({ cwd })
  if (!pkgPath) {
    return null
  }

  return JSON.parse(readSync(pkgPath)) as PackageJSON
}

function match(packageJSON: PackageJSON, dependency: DependencyName | RegExp): string | null {
  const dependencies = {
    ...(packageJSON.dependencies || {}),
    ...(packageJSON.devDependencies || {}),
  }

  if (typeof dependency === 'string' && dependencies[dependency]) {
    return dependencies[dependency]
  }

  const matched = Object.keys(dependencies).find((dep) => dep.match(dependency))

  return matched ? (dependencies[matched] ?? null) : null
}

/**
 * Extracts the first `X[.Y[.Z]]` version tuple from a version string (e.g. `^18.0.0` → `[18, 0, 0]`).
 * Returns `null` when no numeric version can be found.
 */
function coerceSemver(str: string): [number, number, number] | null {
  const m = str.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  if (!m) {
    return null
  }
  return [parseInt(m[1]!, 10), parseInt(m[2] ?? '0', 10), parseInt(m[3] ?? '0', 10)]
}

/**
 * Returns `true` when `pkgVersion` satisfies `range`.
 * Supports operators: `>=`, `>`, `<=`, `<`, `=`, `^`, `~`.
 */
function satisfiesSemver(pkgVersion: string, range: string): boolean {
  const rm = range.trim().match(/^([><=~^]*)(\d[\d.]*)$/)
  if (!rm) {
    return false
  }
  const operator = rm[1] || '>='
  const rangeVer = coerceSemver(rm[2]!)
  const pkgVer = coerceSemver(pkgVersion)
  if (!rangeVer || !pkgVer) {
    return false
  }
  let cmp = 0
  for (let i = 0; i < 3; i++) {
    if (pkgVer[i]! > rangeVer[i]!) {
      cmp = 1
      break
    }
    if (pkgVer[i]! < rangeVer[i]!) {
      cmp = -1
      break
    }
  }
  if (operator === '>=') {
    return cmp >= 0
  }
  if (operator === '>') {
    return cmp > 0
  }
  if (operator === '<=') {
    return cmp <= 0
  }
  if (operator === '<') {
    return cmp < 0
  }
  if (operator === '=' || operator === '==') {
    return cmp === 0
  }
  if (operator === '^') {
    return cmp >= 0 && pkgVer[0] === rangeVer[0]
  }
  if (operator === '~') {
    return cmp >= 0 && pkgVer[0] === rangeVer[0] && pkgVer[1] === rangeVer[1]
  }
  return false
}

function getVersionSync(dependency: DependencyName | RegExp, cwd?: string): DependencyVersion | null {
  const packageJSON = getPackageJSONSync(cwd)

  return packageJSON ? match(packageJSON, dependency) : null
}

/**
 * Returns `true` when the nearest `package.json` declares a dependency that
 * satisfies the given semver range.
 *
 * - Searches both `dependencies` and `devDependencies`.
 * - Accepts a string package name or a `RegExp` to match scoped/pattern packages.
 * - Returns `false` when the version string cannot be parsed as a semver.
 *
 * @example
 * ```ts
 * satisfiesDependency('react', '>=18')          // true when react@18.x is installed
 * satisfiesDependency(/^@tanstack\//, '>=5')    // true when any @tanstack/* >=5 is found
 * ```
 */
export function satisfiesDependency(dependency: DependencyName | RegExp, version: DependencyVersion, cwd?: string): boolean {
  const packageVersion = getVersionSync(dependency, cwd)

  if (!packageVersion) {
    return false
  }

  if (packageVersion === version) {
    return true
  }

  return satisfiesSemver(packageVersion, version)
}
