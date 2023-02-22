import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { ShowPetByIdResponse, ShowPetByIdParams } from '../models/ShowPetById'

export const showPetByIdQueryKey = (params?: ShowPetByIdParams) => ['/pets/{petId}', ...(params ? [params] : [])]

/**
 * @summary Info for a specific pet
 * @link /pets/{petId}
 */
export const useShowPetById = (params: ShowPetByIdParams) => {
  return useQuery<ShowPetByIdResponse>({
    queryKey: showPetByIdQueryKey(params),
    queryFn: () => {
      const template = parseTemplate('/pets/{petId}').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
