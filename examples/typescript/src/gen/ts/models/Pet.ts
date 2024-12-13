import type { Cat } from './Cat.ts'
import type { Dog } from './Dog.ts'
import type { Tag } from './Tag.ts'

export const petTypeEnum = {
  dog: 'dog',
  cat: 'cat',
} as const

export type PetTypeEnum = (typeof petTypeEnum)[keyof typeof petTypeEnum]

export const petStatusEnum = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatusEnum = (typeof petStatusEnum)[keyof typeof petStatusEnum]

export type Pet =
  | (Dog & {
      /**
       * @type integer | undefined, int64
       */
      id?: number
      /**
       * @type string | undefined
       */
      readonly type?: PetTypeEnum
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
      readonly tags?: Tag[]
      /**
       * @description pet status in the store
       * @type string | undefined
       */
      status?: PetStatusEnum
    })
  | (Cat & {
      /**
       * @type integer | undefined, int64
       */
      id?: number
      /**
       * @type string | undefined
       */
      readonly type?: PetTypeEnum
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
      readonly tags?: Tag[]
      /**
       * @description pet status in the store
       * @type string | undefined
       */
      status?: PetStatusEnum
    })
