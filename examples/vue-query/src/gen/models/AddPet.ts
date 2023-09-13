import type { Pet } from './Pet'

/**
 * @description Invalid input
 */
export type AddPet405 = any | null

/**
 * @description Create a new pet in the store
 */
export type AddPetMutationRequest = Pet

/**
 * @description Successful operation
 */
export type AddPetMutationResponse = Pet
