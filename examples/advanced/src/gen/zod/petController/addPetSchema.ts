import * as z from 'zod'
import type { AddPet405, AddPetError, AddPetMutationRequest, AddPetMutationResponse } from '../../models/ts/petController/AddPet.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({
  code: z.optional(z.number().int()),
  message: z.optional(z.string()),
}) as unknown as ToZod<AddPet405>

export type AddPet405Schema = AddPet405

/**
 * @description Successful operation
 */
export const addPetErrorSchema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<AddPetError>

export type AddPetErrorSchema = AddPetError

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema) as unknown as ToZod<AddPetMutationRequest>

export type AddPetMutationRequestSchema = AddPetMutationRequest

export const addPetMutationResponseSchema = z.any() as unknown as ToZod<AddPetMutationResponse>

export type AddPetMutationResponseSchema = AddPetMutationResponse
