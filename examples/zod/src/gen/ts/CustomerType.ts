import type { AddressType } from './AddressType.ts'

export type CustomerType = {
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
  address?: AddressType[]
}
