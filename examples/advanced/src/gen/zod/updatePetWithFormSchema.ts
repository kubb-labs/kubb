import zod from 'zod'

export const updatePetWithFormPathParamsSchema = zod.object({ petId: zod.number().optional() })
export const updatePetWithFormQueryParamsSchema = zod.object({ name: zod.string().optional(), status: zod.string().optional() })
export const updatePetWithFormRequestSchema = zod.any()
export const updatePetWithFormResponseSchema = zod.any()
