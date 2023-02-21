import zod from 'zod'

export const Tag = zod.object({ id: zod.number().optional(), name: zod.string().optional() })
