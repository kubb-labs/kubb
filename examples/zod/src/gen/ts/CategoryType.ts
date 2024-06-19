export type CategoryType = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string | undefined
   */
  name?: string
  parent?: CategoryType
}
