export enum CatType {
  'cat' = 'cat',
}
export type Cat = {
  /**
   * @type integer | undefined
   */
  petsRequested?: number | undefined
  /**
   * @type string
   */
  type: CatType
}
