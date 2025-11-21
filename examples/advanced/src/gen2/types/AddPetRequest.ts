import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusEnumKey = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]

export type AddPetRequest = {
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
  status?: AddPetRequestStatusEnumKey
}
