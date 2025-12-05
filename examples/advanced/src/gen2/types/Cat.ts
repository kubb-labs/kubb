export const catTypeEnum = {
  cat: 'cat',
} as const

export type CatTypeEnumKey = (typeof catTypeEnum)[keyof typeof catTypeEnum]

export type Cat = {
  /**
   * @type string
   */
  readonly type: CatTypeEnumKey
  /**
   * @type string | undefined
   */
  name?: string
  /**
   * @type boolean
   */
  indoor: boolean
}
