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

export type CreateUsersWithListInputMutationResponseType = CreateUsersWithListInput200Type

export type CreateUsersWithListInputTypeMutation = {
  Response: CreateUsersWithListInput200Type
  Request: CreateUsersWithListInputMutationRequestType
  Errors: any
}