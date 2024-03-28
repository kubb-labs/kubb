import type { Category } from './Category'
import type { TagTag } from './tag/Tag'

export const PetStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type PetStatusEnum = (typeof PetStatusEnum)[keyof typeof PetStatusEnum]
export type Pet = {
  /**
   * @type integer | undefined int64
   */
  readonly id?: number
  /**
   * @type string
   */
  name: string
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
