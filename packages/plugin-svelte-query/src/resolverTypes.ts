/**
 * Output keys for the Svelte Query plugin
 * These define all the artifacts that plugin-svelte-query can produce for an operation
 */
export type SvelteQueryOutputKeys =
  | 'hook'
  | 'hookInfinite'
  | 'queryKey'
  | 'queryKeyType'
  | 'queryOptions'
  | 'mutationKey'
  | 'mutationKeyType'
  | 'mutationOptions'
