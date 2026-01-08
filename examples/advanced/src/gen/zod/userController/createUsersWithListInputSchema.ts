import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  CreateUsersWithListInputRequestData,
  CreateUsersWithListInputResponseData,
  CreateUsersWithListInputStatus200,
  CreateUsersWithListInputStatusError,
} from '../../models/ts/userController/CreateUsersWithListInput.ts'
import { userSchema } from '../userSchema.ts'

/**
 * @description Successful operation
 */
export const createUsersWithListInputStatus200Schema = z.lazy(() => userSchema) as unknown as ToZod<CreateUsersWithListInputStatus200>

export type CreateUsersWithListInputStatus200Schema = CreateUsersWithListInputStatus200

/**
 * @description successful operation
 */
export const createUsersWithListInputStatusErrorSchema = z.any() as unknown as ToZod<CreateUsersWithListInputStatusError>

export type CreateUsersWithListInputStatusErrorSchema = CreateUsersWithListInputStatusError

export const createUsersWithListInputRequestDataSchema = z.array(z.lazy(() => userSchema)) as unknown as ToZod<CreateUsersWithListInputRequestData>

export type CreateUsersWithListInputRequestDataSchema = CreateUsersWithListInputRequestData

export const createUsersWithListInputResponseDataSchema = z.lazy(
  () => createUsersWithListInputStatus200Schema,
) as unknown as ToZod<CreateUsersWithListInputResponseData>

export type CreateUsersWithListInputResponseDataSchema = CreateUsersWithListInputResponseData
