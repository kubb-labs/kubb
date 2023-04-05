import z from 'zod'

import { userSchema } from '../userSchema'

export const getUserByNamePathParamsSchema = z.object({ username: z.string() })

/**
 * @description successful operation
 */
export const getUserByNameResponseSchema = z.lazy(() => userSchema)
