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
  /**
   * @type array | undefined
   */
  breed?: [number, string, 'NW' | 'NE' | 'SW' | 'SE'] | undefined
}
