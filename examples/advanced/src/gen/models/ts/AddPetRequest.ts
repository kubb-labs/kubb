import type { Category } from './Category'
import type { Tag } from './Tag'

export const AddPetRequestStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type AddPetRequestStatus = (typeof AddPetRequestStatus)[keyof typeof AddPetRequestStatus]
export type AddPetRequest = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number | undefined
  /**
   * @type string
   * @example doggie
   */
  name: string
  category?: Category | undefined
  /**
   * @type array
   */
  photoUrls: string[]
  /**
   * @type array | undefined
   */
  tags?: Tag[] | undefined
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: AddPetRequestStatus | undefined
}
