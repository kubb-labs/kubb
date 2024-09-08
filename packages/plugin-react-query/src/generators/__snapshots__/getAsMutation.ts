import client from '@kubb/plugin-client/client'
import type { RequestConfig } from '@kubb/plugin-client/client'
import type { UseMutationOptions } from 'custom-swr/mutation'
import { useMutation } from 'custom-swr/mutation'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @link /pet/findByTags
 */
export function findPetsByTags(
  options: {
    mutation?: UseMutationOptions<
      FindPetsByTagsQueryResponse,
      FindPetsByTags400,
      {
        headers: FindPetsByTagsHeaderParams
        params?: FindPetsByTagsQueryParams
      }
    >
    client?: Partial<RequestConfig>
  } = {},
) {
  const { mutation: mutationOptions, client: config = {} } = options ?? {}
  return useMutation({
    mutationFn: async ({ headers, params }: { headers: FindPetsByTagsHeaderParams; params?: FindPetsByTagsQueryParams }) => {
      return findPetsByTags(headers, params, config)
    },
    ...mutationOptions,
  })
}
