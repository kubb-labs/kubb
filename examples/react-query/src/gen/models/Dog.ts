import type { Labradoodle } from './Labradoodle'
import type { Dachshund } from './Dachshund'

export const dogType = {
  dog: 'dog',
} as const
export type DogType = (typeof dogType)[keyof typeof dogType]
export type Dog = {
  /**
   * @type integer | undefined
   */
  barksPerMinute?: number | undefined
  /**
   * @type string
   */
  type: DogType
} & (Labradoodle | Dachshund)
