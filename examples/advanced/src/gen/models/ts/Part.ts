export type Part = {
  /**
   * @type string
   */
  urn: string
  /**
   * @type array
   */
  downloadedWelds: string[]
  /**
   * @type array
   */
  simulatedWelds: string[]
  /**
   * @type integer
   */
  billedWeldCredits: number
}
