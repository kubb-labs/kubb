import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { ListPetsResponse, ListPetsParams, CreatePetsRequest, CreatePetsResponse, ShowPetByIdResponse, ShowPetByIdParams } from './models'

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

/**
 * @summary Create a pet
 * @link /pets
 */
export const useCreatePets = () => {
  return useMutation<CreatePetsResponse, unknown, CreatePetsRequest>({
    mutationFn: (data) => {
      return axios.post('/pets', data).then((res) => res.data)
    },
  })
}

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
