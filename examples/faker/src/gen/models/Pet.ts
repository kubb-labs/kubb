import type { Category } from './Category'
import type { Tag } from './Tag'

export const petStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const
export type PetStatus = (typeof petStatus)[keyof typeof petStatus]
export type Pet = {
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
  status?: PetStatus | undefined
}
