import type { Category } from './Category.js'
import type { TagTag } from './tag/Tag.js'

export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnum = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export type Pet = {
  /**
   * @type integer | undefined, int64
   */
  readonly id?: number
  /**
   * @type string
   */
  name: string
  /**
   * @type object | undefined
   */
  category?: Category
  /**
   * @type array
   */
  photoUrls: string[]
  /**
   * @type array | undefined
   */
  tags?: TagTag[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: PetStatusEnum
}
