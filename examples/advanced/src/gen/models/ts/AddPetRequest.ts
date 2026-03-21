import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusEnumKey = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]

export type AddPetRequestStatusEnum = AddPetRequestStatusEnumKey

export type AddPetRequest = {
  /**
   * @example 10
   * @type integer | undefined
   */
  id?: number
  /**
   * @example doggie
   * @type string
   */
  name: string
  category?: Category
  /**
   * @type array
   */
  photoUrls: Array<string>
  /**
   * @type array | undefined
   */
  tags?: Array<TagTag>
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: AddPetRequestStatusEnumKey
}
