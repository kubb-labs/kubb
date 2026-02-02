/**
 * Output keys for the React Query plugin
 * These define all the artifacts that plugin-react-query can produce for an operation
 */
export type ReactQueryOutputKeys =
  | 'hook'
  | 'hookSuspense'
  | 'hookInfinite'
  | 'hookSuspenseInfinite'
  | 'queryKey'
  | 'queryKeyType'
  | 'queryOptions'
  | 'mutationKey'
  | 'mutationKeyType'
  | 'mutationOptions'
