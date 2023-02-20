import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetPetByIdResponse, GetPetByIdParams } from '../models/ts/GetPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * @link /pet/{petId}
 */
export const useGetPetById = (params: GetPetByIdParams) => {
  return useQuery<GetPetByIdResponse>({
    queryKey: ['useGetPetById'],
    queryFn: () => {
      const template = parseTemplate('/pet/{petId}').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
