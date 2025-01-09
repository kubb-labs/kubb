import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema) as unknown as ToZod<CreateUserError>

export type CreateUserErrorSchema = CreateUserError

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema) as unknown as ToZod<CreateUserMutationRequest>

export type CreateUserMutationRequestSchema = CreateUserMutationRequest

export const createUserMutationResponseSchema = z.any() as unknown as ToZod<CreateUserMutationResponse>

export type CreateUserMutationResponseSchema = CreateUserMutationResponse
