import mod from 'node:module'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

import { findUp, findUpSync } from 'find-up'
import { coerce, satisfies } from 'semver'

type PackageJSON = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type DependencyName =string;

type DependencyVersion =string;

export class PackageManager {
  static #cache: Record<DependencyName,DependencyVersion>={}

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

      if (os.platform() == 'win32') {
        location = pathToFileURL(location).href
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const module = await import(location)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return module?.default ?? module
    } catch (e) {
      console.log(e)
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

    return require(pkgPath) as PackageJSON
  }

  getPackageJSONSync(): PackageJSON | undefined {
    const pkgPath = findUpSync(['package.json'], {
      cwd: this.#cwd,
    })
    if (!pkgPath) {
      return undefined
    }

    return require(pkgPath) as PackageJSON
  }

  static setVersion(dependency: DependencyName, version: DependencyVersion): void{
    PackageManager.#cache[dependency]=version

  }

  async getVersion(dependency: DependencyName): Promise<DependencyVersion | undefined> {

    if(PackageManager.#cache[dependency]){
      return  PackageManager.#cache[dependency]
    }

    const packageJSON = await this.getPackageJSON()

    if (!packageJSON) {
      return undefined
    }

    return packageJSON['dependencies']?.[dependency] || packageJSON['devDependencies']?.[dependency]
  }

  getVersionSync(dependency: DependencyName): DependencyVersion | undefined {

    if(PackageManager.#cache[dependency]){
      return  PackageManager.#cache[dependency]
    }


    const packageJSON = this.getPackageJSONSync()

    if (!packageJSON) {
      return undefined
    }

    return packageJSON['dependencies']?.[dependency] || packageJSON['devDependencies']?.[dependency]
  }

  async isValid(dependency: DependencyName, version: DependencyVersion): Promise<boolean> {
    const packageVersion = await this.getVersion(dependency)

    if (!packageVersion) {
      return false
    }
    const semVer = coerce(packageVersion)

    if (!semVer) {
      throw new Error(`${packageVersion} is not valid`)
    }

    return satisfies(semVer, version)
  }
  isValidSync(dependency: DependencyName, version: DependencyVersion): boolean {
    const packageVersion = this.getVersionSync(dependency)

    if (!packageVersion) {
      return false
    }
    const semVer = coerce(packageVersion)

    if (!semVer) {
      throw new Error(`${packageVersion} is not valid`)
    }

    return satisfies(semVer, version)
  }


}
