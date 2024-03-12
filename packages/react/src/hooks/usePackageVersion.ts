import { PackageManager } from '@kubb/core'

type Props = {
  dependency: string
  version: string
}
/**
 * With `usePackageVersion` you can validate of a specific package is set in the `package.json`.
 */
export function usePackageVersion({ dependency, version }: Props): boolean {
  const manager = new PackageManager()

  return manager.isValidSync(dependency, version)
}
