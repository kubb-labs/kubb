import type { Labradoodle } from './Labradoodle'
import type { Dachshund } from './Dachshund'

export enum DogType {
  'dog' = 'dog',
}
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
