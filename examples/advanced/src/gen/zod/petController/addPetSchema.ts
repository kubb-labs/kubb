import type { AddPet200, AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod/v4'

/**
 * @description Successful operation
 */
export const addPet200Schema = petSchema.omit({ name: true }) as unknown as ToZod<AddPet200>

export type AddPet200Schema = AddPet200

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({
  code: z.optional(z.int()),
  message: z.optional(z.string()),
}) as unknown as ToZod<AddPet405>

export type AddPet405Schema = AddPet405

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = addPetRequestSchema as unknown as ToZod<AddPetMutationRequest>

export type AddPetMutationRequestSchema = AddPetMutationRequest

export const addPetMutationResponseSchema = addPet200Schema as unknown as ToZod<AddPetMutationResponse>

export type AddPetMutationResponseSchema = AddPetMutationResponse
