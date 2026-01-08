import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { CreateUserRequestData, CreateUserResponseData } from '../../../models/ts/userController/CreateUser.ts'
import { createUserRequestDataSchema, createUserResponseDataSchema } from '../../../zod/userController/createUserSchema.ts'

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
  { data }: { data?: CreateUserRequestData },
  config: Partial<RequestConfig<CreateUserRequestData>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createUserRequestDataSchema.parse(data)

  const res = await request<CreateUserResponseData, ResponseErrorConfig<Error>, CreateUserRequestData>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: createUserResponseDataSchema.parse(res.data) }
}
