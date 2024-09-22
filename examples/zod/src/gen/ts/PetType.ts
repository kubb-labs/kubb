import type { CategoryType } from './CategoryType.ts'
import type { TagType } from './TagType.ts'

export const petStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusType = (typeof petStatus)[keyof typeof petStatus]

export type PetType = {
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
  status?: PetStatusType
}
