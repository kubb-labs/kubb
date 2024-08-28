import type { Pet } from './Pet.ts'

/**
 * @description successful operation
 */
export type OptionsFindPetsByStatus200 = Pet[]

/**
 * @description successful operation
 */
export type OptionsFindPetsByStatusMutationResponse = Pet[]

export type OptionsFindPetsByStatusMutation = {
  Response: OptionsFindPetsByStatusMutationResponse
}
