import type { Pet } from '../Pet'

/**
 * UpdatePet400
 * UpdatePet400
 * @description Invalid ID supplied
 */
export type UpdatePet400 = any | null

/**
 * UpdatePet404
 * UpdatePet404
 * @description Pet not found
 */
export type UpdatePet404 = any | null

/**
 * UpdatePet405
 * UpdatePet405
 * @description Validation exception
 */
export type UpdatePet405 = any | null

/**
 * UpdatePetMutationRequest
 * UpdatePetMutationRequest
 * @description Update an existent pet in the store
 */
export type UpdatePetMutationRequest = Pet

/**
 * UpdatePetMutationResponse
 * UpdatePetMutationResponse
 * @description Successful operation
 */
export type UpdatePetMutationResponse = Pet
