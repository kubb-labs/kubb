import type { Cat } from './Cat.ts'
import type { Dog } from './Dog.ts'

export const animalTypeEnum = {
  cat: 'cat',
  dog: 'dog',
} as const

export type AnimalTypeEnumKey = (typeof animalTypeEnum)[keyof typeof animalTypeEnum]

export type Animal =
  | (Cat & {
      /**
       * @type string
       */
      readonly type: AnimalTypeEnumKey
    })
  | (Dog & {
      /**
       * @type string
       */
      readonly type: AnimalTypeEnumKey
    })
