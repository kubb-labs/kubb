export const loginTypeEnum = {
  user: 'user',
  admin: 'admin',
} as const

export type LoginTypeEnum = (typeof loginTypeEnum)[keyof typeof loginTypeEnum]

export type LoginRequest = {
  /**
   * @type string
   */
  email: string
  /**
   * @type string
   */
  password: string
  /**
   * @type string
   */
  type: LoginTypeEnum
}

export type AuthTokenResponse = {
  /**
   * @type string
   */
  authToken: string
}

/**
 * @description Successfull login
 */
export type PostLogin200 = AuthTokenResponse

export type PostLoginMutationRequest = LoginRequest

export type PostLoginMutationResponse = PostLogin200

export type PostLoginMutation = {
  Response: PostLogin200
  Request: PostLoginMutationRequest
  Errors: any
}
