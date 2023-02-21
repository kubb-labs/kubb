import zod from 'zod'

export const ApiResponse = zod.object({ code: zod.number().optional(), type: zod.string().optional(), message: zod.string().optional() })
