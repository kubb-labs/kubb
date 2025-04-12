import type { Address } from './Address.ts'

export type FullAddress = Address & {
  /**
   * @type string
   */
  streetNumber: string
} & {
  /**
   * @type string
   */
  streetName: string
}
