import type { Address } from './Address'

export type Customer = {
  /**
   * @type integer | undefined int64
   * @example 100000
   */
  id?: number
  /**
   * @type string | undefined
   * @example fehguy
   */
  username?: string
  /**
   * @type array | undefined
   */
  address?: Address[]
}
