import type { Tag } from './Tag.ts'

export const addPetRequestStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
  'in store': 'in store',
} as const

export type AddPetRequestStatusEnum = (typeof addPetRequestStatusEnum)[keyof typeof addPetRequestStatusEnum]

export type AddPetRequest = {
  /**
   * @type integer | undefined, int64
   */
  id?: number
  /**
   * @type string
   */
  name: string
  category?: string
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
  status?: AddPetRequestStatusEnum
}
