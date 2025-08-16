import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod/v4'

/**
 * @description successful operation
 */
export const createUserErrorSchema = userSchema as unknown as ToZod<CreateUserError>

export type CreateUserErrorSchema = CreateUserError

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = userSchema.omit({ tag: true }) as unknown as ToZod<CreateUserMutationRequest>

export type CreateUserMutationRequestSchema = CreateUserMutationRequest

export const createUserMutationResponseSchema = z.any() as unknown as ToZod<CreateUserMutationResponse>

export type CreateUserMutationResponseSchema = CreateUserMutationResponse
