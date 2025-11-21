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
   * @type integer | undefined, int64
   */
  readonly id?: number
  /**
   * @type array | undefined
   */
  parent?: Pet[]
  /**
   * @pattern ^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$
   * @type string | undefined
   */
  signature?: string
  /**
   * @type string
   */
  name: string
  /**
   * @maxLength 255
   * @type string | undefined, uri
   */
  url?: string
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
  tags?: TagTag[]
  /**
   * @description pet status in the store
   * @type string | undefined
   */
  status?: PetStatusEnumKey
}
