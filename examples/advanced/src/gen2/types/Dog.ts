export const dogTypeEnum = {
  dog: 'dog',
} as const

export type DogTypeEnum = (typeof dogTypeEnum)[keyof typeof dogTypeEnum]

export type Dog = {
  /**
   * @type string
   */
  readonly type: DogTypeEnum
  /**
   * @type string
   */
  name: string
}
