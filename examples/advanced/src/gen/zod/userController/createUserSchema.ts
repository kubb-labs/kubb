import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'
import { userSchema } from '../userSchema.ts'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema) as unknown as ToZod<CreateUserError>

export type CreateUserErrorSchema = CreateUserError

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema).schema.omit({ tag: true }) as unknown as ToZod<CreateUserMutationRequest>

export type CreateUserMutationRequestSchema = CreateUserMutationRequest

export const createUserMutationResponseSchema = z.any() as unknown as ToZod<CreateUserMutationResponse>

export type CreateUserMutationResponseSchema = CreateUserMutationResponse
