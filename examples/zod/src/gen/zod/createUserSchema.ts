import { z } from 'zod'
import { createUserResultSchema } from './createUserResultSchema'

export const createUserSchema = z.object({ email: z.string().optional() })

/**
 * @description OK
 */
export const createUser201Schema = z.lazy(() => createUserResultSchema)

export const createUserMutationRequestSchema = z.object({ name: z.string() })

/**
 * @description OK
 */
export const createUserMutationResponseSchema = z.lazy(() => createUserResultSchema)
