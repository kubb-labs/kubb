import type { User } from '../User.ts'

/**
 * @description Successful operation
 */
export type CreateUsersWithListInputStatus200 = User

/**
 * @description successful operation
 */
export type CreateUsersWithListInputStatusError = any

export type CreateUsersWithListInputRequestData = User[]

export type CreateUsersWithListInputResponses = {
  '200': CreateUsersWithListInputStatus200
}

export type CreateUsersWithListInputResponseData = CreateUsersWithListInputResponses[keyof CreateUsersWithListInputResponses]
