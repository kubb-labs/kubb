import { findUp, findUpSync } from 'find-up'
import { coerce, satisfies } from 'semver'

type PackageJSON = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export class PackageManager {
  #cwd: string
  constructor(workspace = process.cwd()) {
    this.#cwd = workspace

    return this
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

  async getVersion(dependency: string): Promise<string | undefined> {
    const packageJSON = await this.getPackageJSON()

    if (!packageJSON) {
      return undefined
    }

    return packageJSON['dependencies']?.[dependency] || packageJSON['devDependencies']?.[dependency]
  }

  getVersionSync(dependency: string): string | undefined {
    const packageJSON = this.getPackageJSONSync()

    if (!packageJSON) {
      return undefined
    }

    return packageJSON['dependencies']?.[dependency] || packageJSON['devDependencies']?.[dependency]
  }

  async isValid(dependency: string, version: string): Promise<boolean> {
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
  isValidSync(dependency: string, version: string): boolean {
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
