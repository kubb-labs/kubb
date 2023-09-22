import type { Category } from './Category'
import type { Tag } from './Tag'

export const AddpetrequestStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type AddpetrequestStatus = (typeof AddpetrequestStatus)[keyof typeof AddpetrequestStatus]
export type AddPetRequest = {
  /**
   * @type integer | undefined int64
   * @example 10
   */
  id?: number
  /**
   * @type string
   * @example doggie
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
  status?: AddpetrequestStatus
}
