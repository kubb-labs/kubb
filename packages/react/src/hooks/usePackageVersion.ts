import { PackageManager } from '@kubb/core'

type Props = {
  dependency: string
  version: string
}

export function usePackageVersion({ dependency, version }: Props): boolean {
  const manager = new PackageManager()

  return manager.isValidSync(dependency, version)
}
