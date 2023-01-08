import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { ShowPetByIdResponse, ShowPetByIdParams } from '../models'

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 */
export const useShowPetById = (params: ShowPetByIdParams) => {
  return useQuery<ShowPetByIdResponse>({
    queryKey: ['useShowPetById'],
    queryFn: () => {
      const template = parseTemplate('/pets/{petId}').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
