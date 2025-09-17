import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod/v4'

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = userSchema as unknown as ToZod<CreateUsersWithListInput200>

export type CreateUsersWithListInput200Schema = CreateUsersWithListInput200

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any() as unknown as ToZod<CreateUsersWithListInputError>

export type CreateUsersWithListInputErrorSchema = CreateUsersWithListInputError

export const createUsersWithListInputMutationRequestSchema = z.array(userSchema) as unknown as ToZod<CreateUsersWithListInputMutationRequest>

export type CreateUsersWithListInputMutationRequestSchema = CreateUsersWithListInputMutationRequest

export const createUsersWithListInputMutationResponseSchema = createUsersWithListInput200Schema as unknown as ToZod<CreateUsersWithListInputMutationResponse>

export type CreateUsersWithListInputMutationResponseSchema = CreateUsersWithListInputMutationResponse
