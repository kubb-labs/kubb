import type { Cat } from './Cat.ts'
import type { Dog } from './Dog.ts'

/**
 * Animal
 */
export type Animal =
  | (Cat & {
      readonly type: 'cat'
    })
  | (Dog & {
      readonly type: 'dog'
    })
