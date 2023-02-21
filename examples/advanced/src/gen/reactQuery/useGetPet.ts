import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { GetPetResponse, GetPetParams } from '../models/ts/GetPet'

/**
 * @link /pet
 */
export const useGetPet = (params: GetPetParams) => {
  return useQuery<GetPetResponse>({
    queryKey: ['useGetPet'],
    queryFn: () => {
      const template = parseTemplate('/pet').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
