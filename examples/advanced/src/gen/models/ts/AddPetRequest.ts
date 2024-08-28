import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const AddPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

type AddPetRequestStatusEnum = (typeof AddPetRequestStatusEnum)[keyof typeof AddPetRequestStatusEnum]

export type AddPetRequest = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
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
  status?: AddPetRequestStatusEnum
}
