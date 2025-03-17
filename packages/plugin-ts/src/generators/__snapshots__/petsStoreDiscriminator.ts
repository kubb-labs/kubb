/**
 * @description A project is an analysis project. It has a name, an id, and has a dataset
 */
export type petstore = {
  /**
   * @type integer
   */
  id: number
  /**
   * @type array | undefined
   */
  pets?: (cat | dog)[]
}
