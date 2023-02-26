import type { Dog } from './Dog'
import type { Cat } from './Cat'

export const petCallingCode = {
  '+33': '+33',
  '+420': '+420',
} as const
export type PetCallingCode = (typeof petCallingCode)[keyof typeof petCallingCode]
export const petCountry = {
  "People's Republic of China": "People's Republic of China",
  Uruguay: 'Uruguay',
} as const
export type PetCountry = (typeof petCountry)[keyof typeof petCountry]
export type Pet = {
  /**
   * @type string | undefined iri-reference
   */
  '@id'?: string | undefined
  /**
   * @type integer int64
   */
  id: number
  /**
   * @type string
   */
  name: string
  /**
   * @type string | undefined
   */
  tag?: string | undefined
  /**
   * @type string | undefined email
   */
  email?: string | undefined
  /**
   * @type string | undefined
   */
  callingCode?: PetCallingCode | undefined
  /**
   * @type string | undefined
   */
  country?: PetCountry | undefined
} & (Dog | Cat)
