import type { CategoryType } from './CategoryType.ts'
import type { TagType } from './TagType.ts'

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusEnumType = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]

export type AddPetRequestType = {
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
  category?: CategoryType
  /**
   * @type array
   */
  photoUrls: string[]
  /**
   * @type array | undefined
   */
  tags?: TagType[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: AddPetRequestStatusEnumType
}
