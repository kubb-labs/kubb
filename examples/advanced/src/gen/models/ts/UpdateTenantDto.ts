export type UpdateTenantDto = {
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
