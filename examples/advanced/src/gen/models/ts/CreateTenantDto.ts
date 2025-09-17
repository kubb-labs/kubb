export type CreateTenantDto = {
  /**
   * @type string
   */
  shortName: string
  /**
   * @type string
   */
  name: string
  /**
   * @type number
   */
  resellerId: number
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
