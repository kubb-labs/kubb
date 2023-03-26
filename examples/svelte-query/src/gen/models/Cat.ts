export const catType = {
  cat: 'cat',
} as const
export type CatType = (typeof catType)[keyof typeof catType]
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
