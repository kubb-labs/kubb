import { readSync } from '@internals/utils'
import * as pkg from 'empathic/package'
import { coerce, satisfies } from 'semver'

type PackageJSON = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type DependencyName = string
type DependencyVersion = string

function getPackageJSONSync(cwd?: string): PackageJSON | undefined {
  const pkgPath = pkg.up({ cwd })
  if (!pkgPath) {
    return undefined
  }

  return JSON.parse(readSync(pkgPath)) as PackageJSON
}

function match(packageJSON: PackageJSON, dependency: DependencyName | RegExp): string | undefined {
  const dependencies = {
    ...(packageJSON.dependencies || {}),
    ...(packageJSON.devDependencies || {}),
  }

  if (typeof dependency === 'string' && dependencies[dependency]) {
    return dependencies[dependency]
  }

  const matched = Object.keys(dependencies).find((dep) => dep.match(dependency))

  return matched ? dependencies[matched] : undefined
}

function getVersionSync(dependency: DependencyName | RegExp, cwd?: string): DependencyVersion | undefined {
  const packageJSON = getPackageJSONSync(cwd)

  return packageJSON ? match(packageJSON, dependency) : undefined
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
export function satisfiesDependency(dependency: DependencyName | RegExp, version: DependencyVersion, cwd?: string): boolean {
  const packageVersion = getVersionSync(dependency, cwd)

  if (!packageVersion) {
    return false
  }

  if (packageVersion === version) {
    return true
  }

  const semVer = coerce(packageVersion)

  if (!semVer) {
    return false
  }

  return satisfies(semVer, version)
}
