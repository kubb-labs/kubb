import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UpdatePetWithFormRequest, UpdatePetWithFormResponse } from '../models/ts/UpdatePetWithForm'

/**
 * @summary Updates a pet in the store with form data
 * @link /pet/{petId}
 */
export const useUpdatePetWithForm = () => {
  return useMutation<UpdatePetWithFormResponse, unknown, UpdatePetWithFormRequest>({
    mutationFn: (data) => {
      return axios.post('/pet/{petId}', data).then((res) => res.data)
    },
  })
}
