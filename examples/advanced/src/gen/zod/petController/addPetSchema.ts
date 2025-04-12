import type { AddPet200, AddPet405, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

/**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<AddPet200>

export type AddPet200Schema = AddPet200

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({
  code: z.number().int().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<AddPet405>

export type AddPet405Schema = AddPet405

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema) as unknown as ToZod<AddPetMutationRequest>

export type AddPetMutationRequestSchema = AddPetMutationRequest

export const addPetMutationResponseSchema = z.lazy(() => addPet200Schema) as unknown as ToZod<AddPetMutationResponse>

export type AddPetMutationResponseSchema = AddPetMutationResponse
