import type { Address } from './Address'
export type Customer = {
  /**
   * @type integer | undefined int64
   * @example 100000
   */
  id?: number | undefined
  /**
   * @type string | undefined
   * @example fehguy
   */
  username?: string | undefined
  /**
   * @type array | undefined
   */
  address?: Address[] | undefined
}
