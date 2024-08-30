import type { UserType } from './UserType.ts'

/**
 * @description successful operation
 */
export type CreateUserErrorType = UserType

/**
 * @description Created user object
 */
export type CreateUserMutationRequestType = UserType

export type CreateUserMutationResponseType = any

export type CreateUserTypeMutation = {
  Response: CreateUserMutationResponseType
  Request: CreateUserMutationRequestType
}
