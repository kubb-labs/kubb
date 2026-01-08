import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { UploadFilePathParams, UploadFileQueryParams, UploadFileRequestData, UploadFileResponseData } from '../../models/ts/petController/UploadFile.ts'

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFileHandler({
  petId,
  data,
  params,
}: {
  petId: UploadFilePathParams['petId']
  data?: UploadFileRequestData
  params?: UploadFileQueryParams
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<UploadFileResponseData, ResponseErrorConfig<Error>, UploadFileRequestData>({
    method: 'POST',
    url: `/pet/${petId}/uploadImage`,
    baseURL: 'https://petstore.swagger.io/v2',
    params,
    data: requestData,
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
  }
}
