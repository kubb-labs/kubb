import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { FindPetsByStatusResponse, FindPetsByStatusParams } from '../models/ts/FindPetsByStatus'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @link /pet/findByStatus
 */
export const useFindPetsByStatus = (params: FindPetsByStatusParams) => {
  return useQuery<FindPetsByStatusResponse>({
    queryKey: ['useFindPetsByStatus'],
    queryFn: () => {
      const template = parseTemplate('/pet/findByStatus').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
