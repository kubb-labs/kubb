import type { User } from '../User'

export type UpdateUserMutationResponse = any | null

export type UpdateUserPathParams = {
  /**
   * @description name that need to be deleted
   * @type string
   */
  username: string
}

/**
 * UpdateUsererror
 * UpdateUsererror
 * @description successful operation
 */
export type UpdateUsererror = any | null

/**
 * UpdateUserMutationRequest
 * UpdateUserMutationRequest
 * @description Update an existent user in the store
 */
export type UpdateUserMutationRequest = User
