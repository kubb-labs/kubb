import type { Pet } from './Pet.ts'

/**
 * @description successful operation
 */
export type OptionsFindPetsByStatus200 = Pet[]

export type OptionsFindPetsByStatusMutationResponse = OptionsFindPetsByStatus200

export type OptionsFindPetsByStatusMutation = {
  Response: OptionsFindPetsByStatus200
  Errors: any
}
