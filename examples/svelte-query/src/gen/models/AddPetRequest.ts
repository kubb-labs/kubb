import type { Category } from './Category'
import type { Tag } from './Tag'

export const addPetRequestStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type AddPetRequestStatus = (typeof addPetRequestStatus)[keyof typeof addPetRequestStatus]
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
  tags?: Tag[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: AddPetRequestStatus
}
