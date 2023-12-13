import client from '../../../../axios-client.ts'
import type { ResponseConfig } from '../../../../axios-client.ts'
import type { UploadFileMutation } from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage */
export async function uploadFile(
  { petId }: UploadFileMutation.PathParams,
  data?: UploadFileMutation.Request,
  params?: UploadFileMutation.QueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UploadFileMutation.Response>> {
  const res = await client<UploadFileMutation.Response, UploadFileMutation.Request>({
    method: 'post',
    url: `/pet/${petId}/uploadImage`,
    params,
    data,
    ...options,
  })
  return res
}
