import * as z from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'

export const addPet405Schema = z.object({
  code: z.int().optional(),
  message: z.string().optional(),
})

export type AddPet405Schema = z.infer<typeof addPet405Schema>

export const addPetErrorSchema = petSchema.omit({ name: true }).describe('Successful operation')

export type AddPetErrorSchema = z.infer<typeof addPetErrorSchema>

export const addPetMutationRequestSchema = addPetRequestSchema.describe('Create a new pet in the store')

export type AddPetMutationRequestSchema = z.infer<typeof addPetMutationRequestSchema>

export const addPetMutationResponseSchema = z.any()

export type AddPetMutationResponseSchema = z.infer<typeof addPetMutationResponseSchema>

export const addPetMutationSchema = z.object({
  Response: z.any(),
  Request: addPetMutationRequestSchema,
  Errors: z.union([addPet405Schema, addPetErrorSchema]),
})

export type AddPetMutationSchema = z.infer<typeof addPetMutationSchema>
