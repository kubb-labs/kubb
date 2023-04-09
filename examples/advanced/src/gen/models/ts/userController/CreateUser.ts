import type { User } from '../User'

export type CreateUserResponse = any | null

/**
 * @description successful operation
 */
export type CreateUserError = User

/**
 * @description Created user object
 */
export type CreateUserRequest = User
