import zod from 'zod'

export const tagSchema = zod.object({ id: zod.number().optional(), name: zod.string().optional() })
