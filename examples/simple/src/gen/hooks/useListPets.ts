import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { ListPetsResponse, ListPetsParams } from '../models/ListPets'

export const listPetsQueryKey = (params?: ListPetsParams) => ['/pets', ...(params ? [params] : [])]

/**
 * @summary List all pets
 * @link /pets
 */
export const useListPets = (params: ListPetsParams) => {
  return useQuery<ListPetsResponse>({
    queryKey: listPetsQueryKey(params),
    queryFn: () => {
      const template = parseTemplate('/pets').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
