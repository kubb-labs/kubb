import zod from 'zod'

export const deletePetParamsSchema = zod.object({ petId: zod.number().optional() })
export const deletePetRequestSchema = zod.any()
export const deletePetResponseSchema = zod.any()
