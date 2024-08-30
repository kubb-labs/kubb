import type { UserType } from './UserType.ts'

/**
 * @description Successful operation
 */
export type CreateUsersWithListInput200Type = UserType

/**
 * @description successful operation
 */
export type CreateUsersWithListInputErrorType = any

export type CreateUsersWithListInputMutationRequestType = UserType[]

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputMutationResponseType = UserType

export type CreateUsersWithListInputTypeMutation = {
  Response: CreateUsersWithListInputMutationResponseType
  Request: CreateUsersWithListInputMutationRequestType
}
