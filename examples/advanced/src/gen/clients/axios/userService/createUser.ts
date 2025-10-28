import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../../models/ts/userController/CreateUser.ts'
import { createUserMutationResponseSchema, createUserMutationRequestSchema } from '../../../zod/userController/createUserSchema.ts'

export function getCreateUserUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/user' as const }
  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser(
  { data }: { data?: CreateUserMutationRequest },
  config: Partial<RequestConfig<CreateUserMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createUserMutationRequestSchema.parse(data)

  const res = await request<CreateUserMutationResponse, ResponseErrorConfig<Error>, CreateUserMutationRequest>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: createUserMutationResponseSchema.parse(res.data) }
}
