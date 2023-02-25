import zod from 'zod'

export const deletePetPathParamsSchema = zod.object({ petId: zod.number() })
export const deletePetRequestSchema = zod.any()
export const deletePetResponseSchema = zod.any()
