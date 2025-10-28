import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod/v4'

/**
 * @description Successful operation
 */
export const addPet200Schema = petSchema.omit({ name: true })

export type AddPet200Schema = z.infer<typeof addPet200Schema>

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({
  code: z.optional(z.int()),
  message: z.optional(z.string()),
})

export type AddPet405Schema = z.infer<typeof addPet405Schema>

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = addPetRequestSchema

export type AddPetMutationRequestSchema = z.infer<typeof addPetMutationRequestSchema>

export const addPetMutationResponseSchema = addPet200Schema

export type AddPetMutationResponseSchema = z.infer<typeof addPetMutationResponseSchema>
