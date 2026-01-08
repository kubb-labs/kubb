import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputRequestData, CreateUsersWithListInputResponseData } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import {
  createUsersWithListInputResponseData2Schema,
  createUsersWithListInputRequestData2Schema,
} from '../../../zod/userController/createUsersWithListInputSchema.ts'

export function getCreateUsersWithListInputUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/user/createWithList' as const }
  return res
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  { data }: { data?: CreateUsersWithListInputRequestData },
  config: Partial<RequestConfig<CreateUsersWithListInputRequestData>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createUsersWithListInputRequestData2Schema.parse(data)

  const res = await request<CreateUsersWithListInputResponseData, ResponseErrorConfig<Error>, CreateUsersWithListInputRequestData>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return { ...res, data: createUsersWithListInputResponseData2Schema.parse(res.data) }
}
