import type {
  CreateUsersWithListInput200,
  CreateUsersWithListInputError,
  CreateUsersWithListInputMutationRequest,
  CreateUsersWithListInputMutationResponse,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = z.lazy(() => userSchema)

export type CreateUsersWithListInput200Schema = CreateUsersWithListInput200

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any()

export type CreateUsersWithListInputErrorSchema = CreateUsersWithListInputError

export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema))

export type CreateUsersWithListInputMutationRequestSchema = CreateUsersWithListInputMutationRequest

export const createUsersWithListInputMutationResponseSchema = z.lazy(() => createUsersWithListInput200Schema)

export type CreateUsersWithListInputMutationResponseSchema = CreateUsersWithListInputMutationResponse
