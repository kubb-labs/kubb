import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema)

export type CreateUserErrorSchema = CreateUserError

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)

export type CreateUserMutationRequestSchema = CreateUserMutationRequest

export const createUserMutationResponseSchema = z.any()

export type CreateUserMutationResponseSchema = CreateUserMutationResponse
