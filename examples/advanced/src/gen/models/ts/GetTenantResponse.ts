import type { License } from './License.ts'
import type { Reseller } from './Reseller.ts'
import type { WeldPack } from './WeldPack.ts'

export type GetTenantResponse = {
  /**
   * @type number
   */
  id: number
  /**
   * @type string
   */
  shortName: string
  /**
   * @type string
   */
  name: string
  /**
   * @type array
   */
  emailsAllowed: string[]
  /**
   * @type array
   */
  emailsDenied: string[]
  /**
   * @type array
   */
  domainsAllowed: string[]
  /**
   * @type array
   */
  licenses: License[]
  /**
   * @type array
   */
  weldPacks: WeldPack[]
  /**
   * @type object
   */
  reseller: Reseller
}
