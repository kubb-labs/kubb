export const dogTypeEnum = {
  dog: 'dog',
} as const

export type DogTypeEnumKey = (typeof dogTypeEnum)[keyof typeof dogTypeEnum]

export type Dog = {
  /**
   * @type string
   */
  readonly type: DogTypeEnumKey
  /**
   * @type string
   */
  name: string
}
