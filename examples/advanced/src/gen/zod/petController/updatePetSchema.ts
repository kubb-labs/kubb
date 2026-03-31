import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const updatePet200Schema = petSchema.omit({ name: true }).describe('Successful operation')

export type UpdatePet200Schema = z.infer<typeof updatePet200Schema>

export const updatePet202Schema = z
  .object({
    id: z.int().optional(),
  })
  .describe('accepted operation')

export type UpdatePet202Schema = z.infer<typeof updatePet202Schema>

export const updatePet400Schema = z.any().describe('Invalid ID supplied')

export type UpdatePet400Schema = z.infer<typeof updatePet400Schema>

export const updatePet404Schema = z.any().describe('Pet not found')

export type UpdatePet404Schema = z.infer<typeof updatePet404Schema>

export const updatePet405Schema = z.any().describe('Validation exception')

export type UpdatePet405Schema = z.infer<typeof updatePet405Schema>

export const updatePetMutationRequestSchema = petSchema.omit({ id: true }).describe('Update an existent pet in the store')

export type UpdatePetMutationRequestSchema = z.infer<typeof updatePetMutationRequestSchema>

export const updatePetMutationResponseSchema = z.union([updatePet200Schema, updatePet202Schema])

export type UpdatePetMutationResponseSchema = z.infer<typeof updatePetMutationResponseSchema>

export const updatePetMutationSchema = z.object({
  Response: z.union([updatePet200Schema, updatePet202Schema]),
  Request: updatePetMutationRequestSchema,
  Errors: z.union([updatePet400Schema, updatePet404Schema, updatePet405Schema]),
})

export type UpdatePetMutationSchema = z.infer<typeof updatePetMutationSchema>
