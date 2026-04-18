import { findPackageJSON, readSync } from '@internals/utils'

type PackageJSON = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type DependencyName = string
type DependencyVersion = string

function getPackageJSONSync(cwd?: string): PackageJSON | null {
  const pkgPath = findPackageJSON(cwd)
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
 * - Uses `semver.satisfies` for range comparison; returns `false` when the
 *   version string cannot be coerced into a valid semver.
 *
 * @example
 * ```ts
 * satisfiesDependency('react', '>=18')          // true when react@18.x is installed
 * satisfiesDependency(/^@tanstack\//, '>=5')    // true when any @tanstack/* >=5 is found
 * ```
 */
function coerceSemver(version: string): [number, number, number] | null {
  const m = version.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  return m ? [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)] : null
}

function satisfiesSemver(v: [number, number, number], range: string): boolean {
  return range
    .trim()
    .split(/\s+/)
    .every((cond) => {
      const m = cond.match(/^(>=|<=|>|<|=|\^|~)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/)
      if (!m) return false
      const op = m[1] ?? '='
      const r: [number, number, number] = [Number(m[2]), Number(m[3] ?? 0), Number(m[4] ?? 0)]
      const cmp = v[0] !== r[0] ? v[0] - r[0] : v[1] !== r[1] ? v[1] - r[1] : v[2] - r[2]
      if (op === '>=') return cmp >= 0
      if (op === '<=') return cmp <= 0
      if (op === '>') return cmp > 0
      if (op === '<') return cmp < 0
      if (op === '^') return v[0] === r[0] && cmp >= 0
      if (op === '~') return v[0] === r[0] && v[1] === r[1] && cmp >= 0
      return cmp === 0
    })
}

export function satisfiesDependency(dependency: DependencyName | RegExp, version: DependencyVersion, cwd?: string): boolean {
  const packageVersion = getVersionSync(dependency, cwd)

  if (!packageVersion) {
    return false
  }

  if (packageVersion === version) {
    return true
  }

  const semVer = coerceSemver(packageVersion)

  if (!semVer) {
    return false
  }

  return satisfiesSemver(semVer, version)
}
