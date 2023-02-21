import zod from 'zod'

export const Category = zod.object({ id: zod.number().optional(), name: zod.string().optional() })
