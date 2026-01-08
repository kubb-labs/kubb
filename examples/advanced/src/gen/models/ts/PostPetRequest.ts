import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const postPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PostPetRequestStatusEnumKey = (typeof postPetRequestStatusEnum)[keyof typeof postPetRequestStatusEnum]

export type PostPetRequest = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
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
  status?: PostPetRequestStatusEnumKey
}
