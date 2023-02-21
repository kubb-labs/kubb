import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { ListPetsResponse, ListPetsParams, CreatePetsRequest, CreatePetsResponse, ShowPetByIdResponse, ShowPetByIdParams } from './models'

/**
 * @summary List all pets
 * @link /pets
 */
export const useListPets = (params: ListPetsParams) => {
  return useQuery<ListPetsResponse>({
    queryKey: ['useListPets'],
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
