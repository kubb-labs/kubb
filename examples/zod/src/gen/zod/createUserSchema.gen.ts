import type { CreateUserErrorType, CreateUserMutationRequestType, CreateUserMutationResponseType } from '../ts/CreateUserType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema) as unknown as ToZod<CreateUserErrorType>

export type CreateUserErrorSchema = CreateUserErrorType

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema) as unknown as ToZod<CreateUserMutationRequestType>

export type CreateUserMutationRequestSchema = CreateUserMutationRequestType

export const createUserMutationResponseSchema = z.any() as unknown as ToZod<CreateUserMutationResponseType>

export type CreateUserMutationResponseSchema = CreateUserMutationResponseType
