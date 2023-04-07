import type { Pet } from '../Pet'

/**
 * @description Invalid input
 */
export type AddPet405 = any | null

/**
 * @description Create a new pet in the store
 */
export type AddPetRequest = Pet

/**
 * @description Successful operation
 */
export type AddPetResponse = Pet
