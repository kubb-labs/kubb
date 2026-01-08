import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { UpdateUserPathParams, UpdateUserRequestData, UpdateUserResponseData } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUserRequestDataSchema, updateUserResponseDataSchema } from '../../../zod/userController/updateUserSchema.ts'

export function getUpdateUserUrl({ username }: { username: UpdateUserPathParams['username'] }) {
  const res = { method: 'PUT', url: `https://petstore3.swagger.io/api/v3/user/${username}` as const }
  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUser(
  { username, data }: { username: UpdateUserPathParams['username']; data?: UpdateUserRequestData },
  config: Partial<RequestConfig<UpdateUserRequestData>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = updateUserRequestDataSchema.parse(data)

  const res = await request<UpdateUserResponseData, ResponseErrorConfig<Error>, UpdateUserRequestData>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: updateUserResponseDataSchema.parse(res.data) }
}
