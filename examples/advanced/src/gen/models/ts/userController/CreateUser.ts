import type { User } from '../User'

export type CreateUserResponse = any | null

/**
 * @description Created user object
 */
export type CreateUserRequest = User

/**
 * @description successful operation
 */
export type CreateUserError = User
