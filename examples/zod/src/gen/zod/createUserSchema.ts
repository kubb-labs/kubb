import { z } from 'zod'
import { createUserResultSchema } from './createUserResultSchema'

export const createUserSchema = z.object({ email: z.string().optional() })
export const createUserMutationRequestSchema = z.object({ name: z.string() })

/**
 * @description OK
 */
export const createUser201Schema = z.lazy(() => createUserResultSchema)

/**
 * @description OK
 */
export const createUserMutationResponseSchema = z.lazy(() => createUserResultSchema)
