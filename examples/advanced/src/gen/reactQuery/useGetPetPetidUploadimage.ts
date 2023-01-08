import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetPetPetidUploadimageResponse, GetPetPetidUploadimageParams } from './models/GetPetPetidUploadimage'

/**
 * @link /pet/{petId}/uploadImage
 */
export const useGetPetPetidUploadimage = (params: GetPetPetidUploadimageParams) => {
  return useQuery<GetPetPetidUploadimageResponse>({
    queryKey: ['useGetPetPetidUploadimage'],
    queryFn: () => {
      const template = parseTemplate('/pet/{petId}/uploadImage').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
