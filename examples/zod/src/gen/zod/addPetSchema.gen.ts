import type { AddPet200Type, AddPet405Type, AddPetMutationRequestType, AddPetMutationResponseType } from '../ts/AddPetType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { addPetRequestSchema } from './addPetRequestSchema.gen.ts'
import { petSchema } from './petSchema.gen.ts'

/**
 * @description Successful operation
 */
export const addPet200Schema = z.lazy(() => petSchema) as unknown as ToZod<AddPet200Type>

export type AddPet200Schema = AddPet200Type

/**
 * @description Pet not found
 */
export const addPet405Schema = z.object({
  code: z.number().int().optional(),
  message: z.string().optional(),
}) as unknown as ToZod<AddPet405Type>

export type AddPet405Schema = AddPet405Type

/**
 * @description Create a new pet in the store
 */
export const addPetMutationRequestSchema = z.lazy(() => addPetRequestSchema) as unknown as ToZod<AddPetMutationRequestType>

export type AddPetMutationRequestSchema = AddPetMutationRequestType

export const addPetMutationResponseSchema = z.lazy(() => addPet200Schema) as unknown as ToZod<AddPetMutationResponseType>

export type AddPetMutationResponseSchema = AddPetMutationResponseType
