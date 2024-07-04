import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen'

export const getPetByIdPathParamsSchema = z.object({ petId: z.number().describe('ID of pet to return') })
export type GetPetByIdPathParamsSchema = z.infer<typeof getPetByIdPathParamsSchema>
/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema)
export type GetPetById200Schema = z.infer<typeof getPetById200Schema>
/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()
export type GetPetById400Schema = z.infer<typeof getPetById400Schema>
/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()
export type GetPetById404Schema = z.infer<typeof getPetById404Schema>
/**
 * @description successful operation
 */
export const getPetByIdQueryResponseSchema = z.lazy(() => petSchema)
export type GetPetByIdQueryResponseSchema = z.infer<typeof getPetByIdQueryResponseSchema>
