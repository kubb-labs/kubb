import { rimraf } from 'rimraf'

export async function clean(path: string): Promise<boolean> {
  return rimraf(path)
}
