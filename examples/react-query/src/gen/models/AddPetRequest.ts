// version: 1.0.11
import type { Category } from './Category.ts'
import type { Tag } from './Tag.ts'

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusEnumKey = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]

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
  tags?: Tag[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: AddPetRequestStatusEnumKey
}
