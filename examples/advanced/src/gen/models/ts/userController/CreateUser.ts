import type { User } from '../User.ts'

/**
 * @description successful operation
 */
export type CreateUserStatusError = User

/**
 * @description Created user object
 */
export type CreateUserRequestData = Omit<NonNullable<User>, 'tag'>

export type CreateUserResponseData = any
