// version: 1.0.11
import type { Address } from './Address.ts'

export type Customer = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  username?: string
  /**
   * @type array | undefined
   */
  address?: Address[]
}
