import { rimraf } from 'rimraf'

export async function clean(path: string) {
  return rimraf(path)
}
