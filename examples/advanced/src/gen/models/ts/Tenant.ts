export type Tenant = {
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
}
