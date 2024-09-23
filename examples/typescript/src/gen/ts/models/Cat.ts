export const catType = {
  cat: 'cat',
} as const

export type CatType = (typeof catType)[keyof typeof catType]

export type Cat = {
  /**
   * @type string
   */
  readonly type: CatType
  /**
   * @type string | undefined
   */
  name?: string
}
