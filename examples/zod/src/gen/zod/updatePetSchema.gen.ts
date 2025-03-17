import type {
  UpdatePet200Type,
  UpdatePet400Type,
  UpdatePet404Type,
  UpdatePet405Type,
  UpdatePetMutationRequestType,
  UpdatePetMutationResponseType,
} from '../ts/UpdatePetType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen.ts'

/**
 * @description Successful operation
 */
export const updatePet200Schema = z.lazy(() => petSchema) as unknown as ToZod<UpdatePet200Type>

export type UpdatePet200Schema = UpdatePet200Type

/**
 * @description Invalid ID supplied
 */
export const updatePet400Schema = z.any() as unknown as ToZod<UpdatePet400Type>

export type UpdatePet400Schema = UpdatePet400Type

/**
 * @description Pet not found
 */
export const updatePet404Schema = z.any() as unknown as ToZod<UpdatePet404Type>

export type UpdatePet404Schema = UpdatePet404Type

/**
 * @description Validation exception
 */
export const updatePet405Schema = z.any() as unknown as ToZod<UpdatePet405Type>

export type UpdatePet405Schema = UpdatePet405Type

/**
 * @description Update an existent pet in the store
 */
export const updatePetMutationRequestSchema = z.lazy(() => petSchema) as unknown as ToZod<UpdatePetMutationRequestType>

export type UpdatePetMutationRequestSchema = UpdatePetMutationRequestType

export const updatePetMutationResponseSchema = z.lazy(() => updatePet200Schema) as unknown as ToZod<UpdatePetMutationResponseType>

export type UpdatePetMutationResponseSchema = UpdatePetMutationResponseType
