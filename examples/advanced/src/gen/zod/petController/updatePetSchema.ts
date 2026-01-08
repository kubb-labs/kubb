import type {
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
  UpdatePetRequestData,
  UpdatePetResponseData,
} from '../../models/ts/petController/UpdatePet.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

/**
 * @description Successful operation
 */
export const updatePetStatus200Schema = z.lazy(() => petSchema).schema.omit({ name: true }) as unknown as ToZod<UpdatePetStatus200>

export type UpdatePetStatus200Schema = UpdatePetStatus200

/**
 * @description accepted operation
 */
export const updatePetStatus202Schema = z.object({
  id: z.optional(z.number().int()),
}) as unknown as ToZod<UpdatePetStatus202>

export type UpdatePetStatus202Schema = UpdatePetStatus202

/**
 * @description Invalid ID supplied
 */
export const updatePetStatus400Schema = z.any() as unknown as ToZod<UpdatePetStatus400>

export type UpdatePetStatus400Schema = UpdatePetStatus400

/**
 * @description Pet not found
 */
export const updatePetStatus404Schema = z.any() as unknown as ToZod<UpdatePetStatus404>

export type UpdatePetStatus404Schema = UpdatePetStatus404

/**
 * @description Validation exception
 */
export const updatePetStatus405Schema = z.any() as unknown as ToZod<UpdatePetStatus405>

export type UpdatePetStatus405Schema = UpdatePetStatus405

/**
 * @description Update an existent pet in the store
 */
export const updatePetRequestDataSchema = z.lazy(() => petSchema).schema.omit({ id: true }) as unknown as ToZod<UpdatePetRequestData>

export type UpdatePetRequestDataSchema = UpdatePetRequestData

export const updatePetResponseDataSchema = z.union([
  z.lazy(() => updatePetStatus200Schema),
  z.lazy(() => updatePetStatus202Schema),
]) as unknown as ToZod<UpdatePetResponseData>

export type UpdatePetResponseDataSchema = UpdatePetResponseData
