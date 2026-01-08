import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { CreateUserRequestData, CreateUserResponseData, CreateUserStatusError } from '../../models/ts/userController/CreateUser.ts'
import { userSchema } from '../userSchema.ts'

/**
 * @description successful operation
 */
export const createUserStatusErrorSchema = z.lazy(() => userSchema) as unknown as ToZod<CreateUserStatusError>

export type CreateUserStatusErrorSchema = CreateUserStatusError

/**
 * @description Created user object
 */
export const createUserRequestDataSchema = z.lazy(() => userSchema).schema.omit({ tag: true }) as unknown as ToZod<CreateUserRequestData>

export type CreateUserRequestDataSchema = CreateUserRequestData

export const createUserResponseDataSchema = z.any() as unknown as ToZod<CreateUserResponseData>

export type CreateUserResponseDataSchema = CreateUserResponseData
