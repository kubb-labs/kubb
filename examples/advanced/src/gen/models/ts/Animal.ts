import type { Cat } from './Cat.ts'
import type { Dog } from './Dog.ts'

export type Animal =
  | (Cat & {
      /**
       * @type string
       */
      readonly type: 'cat'
    })
  | (Dog & {
      /**
       * @type string
       */
      readonly type: 'dog'
    })
