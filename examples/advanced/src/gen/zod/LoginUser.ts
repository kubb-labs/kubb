import zod from 'zod'

export const LoginUserParams = zod.object({ username: zod.string().optional(), password: zod.string().optional() })
export const LoginUserResponse = zod.string()
