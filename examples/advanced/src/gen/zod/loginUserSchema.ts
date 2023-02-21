import zod from 'zod'

export const loginUserParamsSchema = zod.object({ username: zod.string().optional(), password: zod.string().optional() })
export const loginUserResponseSchema = zod.string()
