import type { Image } from './Image.ts'

/**
 * Dog
 */
export type Dog = {
  /**
   * @minLength 1
   */
  readonly type: string
  name: string
  image?: Image
}
