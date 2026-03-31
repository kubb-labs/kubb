import type { Image } from './Image.ts'

/**
 * @type object
 */
export type Dog = {
  /**
   * @minLength 1
   * @type string
   */
  readonly type: string
  /**
   * @type string
   */
  name: string
  /**
   * @example linode/debian10
   * @type string | undefined
   */
  readonly image?: Image | null
}
