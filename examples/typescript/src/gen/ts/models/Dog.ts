export const dogType = {
  dog: 'dog',
} as const

export type DogType = (typeof dogType)[keyof typeof dogType]

export type Dog = {
  /**
   * @type string
   */
  readonly type: DogType
  /**
   * @type string | undefined
   */
  bark?: string
}
