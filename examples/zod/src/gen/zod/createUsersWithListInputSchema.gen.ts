import type {
  CreateUsersWithListInput200Type,
  CreateUsersWithListInputErrorType,
  CreateUsersWithListInputMutationRequestType,
  CreateUsersWithListInputMutationResponseType,
} from '../ts/CreateUsersWithListInputType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = z.lazy(() => userSchema) as unknown as ToZod<CreateUsersWithListInput200Type>

export type CreateUsersWithListInput200Schema = CreateUsersWithListInput200Type

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any() as unknown as ToZod<CreateUsersWithListInputErrorType>

export type CreateUsersWithListInputErrorSchema = CreateUsersWithListInputErrorType

export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema)) as unknown as ToZod<CreateUsersWithListInputMutationRequestType>

export type CreateUsersWithListInputMutationRequestSchema = CreateUsersWithListInputMutationRequestType

export const createUsersWithListInputMutationResponseSchema = z.lazy(
  () => createUsersWithListInput200Schema,
) as unknown as ToZod<CreateUsersWithListInputMutationResponseType>

export type CreateUsersWithListInputMutationResponseSchema = CreateUsersWithListInputMutationResponseType
