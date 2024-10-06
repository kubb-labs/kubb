export const catTypeEnum = {
  cat: 'cat',
} as const

export type CatTypeEnum = (typeof catTypeEnum)[keyof typeof catTypeEnum]

export type Cat = {
  /**
   * @type string
   */
  readonly type: CatTypeEnum
  /**
   * @type string | undefined
   */
  name?: string
}
