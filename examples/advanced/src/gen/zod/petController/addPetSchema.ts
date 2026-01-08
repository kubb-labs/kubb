import type { AddPetStatus200, AddPetStatus405, AddPetRequestData, AddPetResponseData } from '../../models/ts/petController/AddPet.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

/**
 * @description Successful operation
 */
export const addPetStatus200Schema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<AddPetStatus200>

export type AddPetStatus200Schema = AddPetStatus200

/**
 * @description Pet not found
 */
export const addPetStatus405Schema = z.object({
  code: z.optional(z.number().int()),
  message: z.optional(z.string()),
}) as unknown as ToZod<AddPetStatus405>

export type AddPetStatus405Schema = AddPetStatus405

/**
 * @description Create a new pet in the store
 */
export const addPetRequestDataSchema = z.lazy(() => addPetRequestSchema) as unknown as ToZod<AddPetRequestData>

export type AddPetRequestDataSchema = AddPetRequestData

export const addPetResponseDataSchema = z.lazy(() => addPetStatus200Schema) as unknown as ToZod<AddPetResponseData>

export type AddPetResponseDataSchema = AddPetResponseData
