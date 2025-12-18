import mod from 'node:module'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

import { findUp, findUpSync } from 'find-up'
import { coerce, satisfies } from 'semver'

import { read, readSync } from './fs/index.ts'

type PackageJSON = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type DependencyName = string

type DependencyVersion = string

export class PackageManager {
  static #cache: Record<DependencyName, DependencyVersion> = {}

  #cwd?: string
  #SLASHES = new Set(['/', '\\'])
  constructor(workspace?: string) {
    if (workspace) {
      this.#cwd = workspace
    }

    return this
  }

  set workspace(workspace: string) {
    this.#cwd = workspace
  }

  get workspace(): string | undefined {
    return this.#cwd
  }

  normalizeDirectory(directory: string): string {
    if (!this.#SLASHES.has(directory[directory.length - 1]!)) {
      return `${directory}/`
    }

    return directory
  }

  getLocation(path: string): string {
    let location = path

    if (this.#cwd) {
      const require = mod.createRequire(this.normalizeDirectory(this.#cwd))
      location = require.resolve(path)
    }

    return location
  }

  async import(path: string): Promise<any | undefined> {
    try {
      let location = this.getLocation(path)

      if (os.platform() === 'win32') {
        location = pathToFileURL(location).href
      }

      const module = await import(location)

      return module?.default ?? module
    } catch (error) {
      console.error(error)
      return undefined
    }
  }

  async getPackageJSON(): Promise<PackageJSON | undefined> {
    const pkgPath = await findUp(['package.json'], {
      cwd: this.#cwd,
    })
    if (!pkgPath) {
      return undefined
    }

    const json = await read(pkgPath)

    return JSON.parse(json) as PackageJSON
  }

  getPackageJSONSync(): PackageJSON | undefined {
    const pkgPath = findUpSync(['package.json'], {
      cwd: this.#cwd,
    })
    if (!pkgPath) {
      return undefined
    }

    const json = readSync(pkgPath)

    return JSON.parse(json) as PackageJSON
  }

  static setVersion(dependency: DependencyName, version: DependencyVersion): void {
    PackageManager.#cache[dependency] = version
  }

  #match(packageJSON: PackageJSON, dependency: DependencyName | RegExp): string | undefined {
    const dependencies = {
      ...(packageJSON['dependencies'] || {}),
      ...(packageJSON['devDependencies'] || {}),
    }

    if (typeof dependency === 'string' && dependencies[dependency]) {
      return dependencies[dependency]
    }

    const matchedDependency = Object.keys(dependencies).find((dep) => dep.match(dependency))

    return matchedDependency ? dependencies[matchedDependency] : undefined
  }

  async getVersion(dependency: DependencyName | RegExp): Promise<DependencyVersion | undefined> {
    if (typeof dependency === 'string' && PackageManager.#cache[dependency]) {
      return PackageManager.#cache[dependency]
    }

    const packageJSON = await this.getPackageJSON()

    if (!packageJSON) {
      return undefined
    }

    return this.#match(packageJSON, dependency)
  }

  getVersionSync(dependency: DependencyName | RegExp): DependencyVersion | undefined {
    if (typeof dependency === 'string' && PackageManager.#cache[dependency]) {
      return PackageManager.#cache[dependency]
    }

    const packageJSON = this.getPackageJSONSync()

    if (!packageJSON) {
      return undefined
    }

    return this.#match(packageJSON, dependency)
  }

  async isValid(dependency: DependencyName | RegExp, version: DependencyVersion): Promise<boolean> {
    const packageVersion = await this.getVersion(dependency)

    if (!packageVersion) {
      return false
    }

    if (packageVersion === version) {
      return true
    }

    const semVer = coerce(packageVersion)

    if (!semVer) {
      throw new Error(`${packageVersion} is not valid`)
    }

    return satisfies(semVer, version)
  }
  isValidSync(dependency: DependencyName | RegExp, version: DependencyVersion): boolean {
    const packageVersion = this.getVersionSync(dependency)

    if (!packageVersion) {
      return false
    }

    if (version === 'next' && packageVersion === version) {
      return true
    }

    const semVer = coerce(packageVersion)

    if (!semVer) {
      return false
    }

    return satisfies(semVer, version)
  }
}
