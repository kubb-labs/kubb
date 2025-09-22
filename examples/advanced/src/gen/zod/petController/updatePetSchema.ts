import { petSchema } from '../petSchema.ts'
import { z } from 'zod/v4'

/**
 * @description Successful operation
 */
export const updatePet200Schema = petSchema.omit({ name: true })

export type UpdatePet200Schema = z.infer<typeof updatePet200Schema>

/**
 * @description accepted operation
 */
export const updatePet202Schema = z.object({
  id: z.optional(z.int()),
})

export type UpdatePet202Schema = z.infer<typeof updatePet202Schema>

/**
 * @description Invalid ID supplied
 */
export const updatePet400Schema = z.any()

export type UpdatePet400Schema = z.infer<typeof updatePet400Schema>

/**
 * @description Pet not found
 */
export const updatePet404Schema = z.any()

export type UpdatePet404Schema = z.infer<typeof updatePet404Schema>

/**
 * @description Validation exception
 */
export const updatePet405Schema = z.any()

export type UpdatePet405Schema = z.infer<typeof updatePet405Schema>

/**
 * @description Update an existent pet in the store
 */
export const updatePetMutationRequestSchema = petSchema.omit({ id: true })

export type UpdatePetMutationRequestSchema = z.infer<typeof updatePetMutationRequestSchema>

export const updatePetMutationResponseSchema = z.union([updatePet200Schema, updatePet202Schema])

export type UpdatePetMutationResponseSchema = z.infer<typeof updatePetMutationResponseSchema>
