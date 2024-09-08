import { z } from 'zod'

/**
 * @description Null response
 */
export const createPets201 = z.unknown()

/**
 * @description unexpected error
 */
export const createPetsError = z.lazy(() => error)

export const createPetsMutationRequest = z.object({ name: z.string(), tag: z.string() })

export const createPetsMutationResponse = z.unknown()
