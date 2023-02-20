import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UploadFileRequest, UploadFileResponse } from '../models/ts/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/{petId}/uploadImage
 */
export const useUploadFile = () => {
  return useMutation<UploadFileResponse, unknown, UploadFileRequest>({
    mutationFn: (data) => {
      return axios.post('/pet/{petId}/uploadImage', data).then((res) => res.data)
    },
  })
}
