import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export type Pet = {
  /**
   * @example 10
   * @type integer | undefined
   */
  readonly id?: number
  /**
   * @type array | undefined
   */
  parent?: Array<Pet>
  /**
   * @pattern ^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$
   * @type string | undefined
   */
  signature?: string
  /**
   * @example doggie
   * @type string
   */
  name: string
  /**
   * @type string | undefined
   */
  url?: string
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
  status?: PetStatusEnumKey
}
