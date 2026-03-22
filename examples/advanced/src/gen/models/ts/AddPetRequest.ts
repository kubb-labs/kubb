import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusEnumKey = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]

export type AddPetRequest = {
  id?: number
  name: string
  category?: Category
  photoUrls: Array<string>
  tags?: Array<TagTag>
  /**
   * @description pet status in the store
   */
  status?: AddPetRequestStatusEnumKey
}
