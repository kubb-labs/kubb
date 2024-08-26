import type { CategoryType } from './CategoryType'
import type { TagType } from './TagType'

export const addPetRequestStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type AddPetRequestStatusType = (typeof addPetRequestStatus)[keyof typeof addPetRequestStatus]

export type AddPetRequestType = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string
   */
  name: string
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
  status?: AddPetRequestStatusType
}
