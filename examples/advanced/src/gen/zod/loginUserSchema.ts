import zod from 'zod'

export const loginUserPathParamsSchema = zod.object({})
export const loginUserQueryParamsSchema = zod.object({
  username: zod.string().optional(),
  password: zod.string().optional(),
})
export const loginUserResponseSchema = zod.string()
