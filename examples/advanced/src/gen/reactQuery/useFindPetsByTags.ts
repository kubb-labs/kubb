import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { parseTemplate } from 'url-template'

import type { FindPetsByTagsResponse, FindPetsByTagsParams } from '../models/ts/FindPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export const useFindPetsByTags = (params: FindPetsByTagsParams) => {
  return useQuery<FindPetsByTagsResponse>({
    queryKey: ['useFindPetsByTags'],
    queryFn: () => {
      const template = parseTemplate('/pet/findByTags').expand(params)
      return axios.get(template).then((res) => res.data)
    },
  })
}
