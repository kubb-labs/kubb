import zod from 'zod'

export const updatePetWithFormParamsSchema = zod.object({ petId: zod.number().optional(), name: zod.string().optional(), status: zod.string().optional() })
export const updatePetWithFormRequestSchema = zod.any()
export const updatePetWithFormResponseSchema = zod.any()
