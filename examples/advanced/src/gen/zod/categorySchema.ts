import zod from 'zod'

export const categorySchema = zod.object({ id: zod.number().optional(), name: zod.string().optional() })
