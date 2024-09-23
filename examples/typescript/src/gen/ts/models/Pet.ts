import type { Cat } from './Cat.ts'
import type { Dog } from './Dog.ts'
import type { Tag } from './Tag.ts'

export const petType = {
  dog: 'dog',
  cat: 'cat',
} as const

export type PetType = (typeof petType)[keyof typeof petType]

export const petStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type PetStatus = (typeof petStatus)[keyof typeof petStatus]

export type Pet =
  | (Dog & {
      /**
       * @type integer | undefined, int64
       */
      id?: number
      /**
       * @type string | undefined
       */
      readonly type?: PetType
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
      status?: PetStatus
    })
  | (Cat & {
      /**
       * @type integer | undefined, int64
       */
      id?: number
      /**
       * @type string | undefined
       */
      readonly type?: PetType
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
      status?: PetStatus
    })
