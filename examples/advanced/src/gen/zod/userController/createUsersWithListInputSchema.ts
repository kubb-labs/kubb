import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = z.lazy(() => userSchema) as unknown as ToZod<CreateUsersWithListInput200>

export type CreateUsersWithListInput200Schema = CreateUsersWithListInput200

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any() as unknown as ToZod<CreateUsersWithListInputError>

export type CreateUsersWithListInputErrorSchema = CreateUsersWithListInputError

export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema)) as unknown as ToZod<CreateUsersWithListInputMutationRequest>

export type CreateUsersWithListInputMutationRequestSchema = CreateUsersWithListInputMutationRequest

export const createUsersWithListInputMutationResponseSchema = z.lazy(
  () => createUsersWithListInput200Schema,
) as unknown as ToZod<CreateUsersWithListInputMutationResponse>

export type CreateUsersWithListInputMutationResponseSchema = CreateUsersWithListInputMutationResponse
