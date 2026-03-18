import type { Cat } from './Cat.ts'
import type { Category } from './Category.ts'
import type { Dog } from './Dog.ts'
import type { Tag } from './Tag.ts'

export enum PetStatusEnum {
  available = 'available',
  pending = 'pending',
  sold = 'sold',
}

export type Pet =
  | (Dog & {
      /**
       * @example 10
       * @type integer | undefined
       */
      id?: number
      /**
       * @type string
       */
      readonly type: 'dog'
      /**
       * @example doggie
       * @type string
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
      readonly tags?: Tag[]
      /**
       * @description pet status in the store
       * @type string | undefined
       */
      status?: PetStatusEnum
    })
  | (Cat & {
      /**
       * @example 10
       * @type integer | undefined
       */
      id?: number
      /**
       * @type string
       */
      readonly type: 'cat'
      /**
       * @example doggie
       * @type string
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
      readonly tags?: Tag[]
      /**
       * @description pet status in the store
       * @type string | undefined
       */
      status?: PetStatusEnum
    })
