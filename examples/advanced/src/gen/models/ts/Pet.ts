import type { Category } from './Category.ts'
import type { TagTag } from './tag/Tag.ts'

export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnumKey = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export type Pet = {
  readonly id?: number
  parent?: Array<Pet>
  /**
   * @pattern ^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$
   */
  signature?: string
  name: string
  url?: string
  category?: Category
  photoUrls: Array<string>
  tags?: Array<TagTag>
  /**
   * @description pet status in the store
   */
  status?: PetStatusEnumKey
}
