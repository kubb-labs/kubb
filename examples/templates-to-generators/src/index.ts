/**
 * Example usage of the generated React Query hooks with custom query options
 * 
 * This demonstrates the v4 generator pattern with:
 * - Performance timing
 * - FormData support
 * - Custom headers
 * - Infinite queries
 */

// The generated hooks will be available after running `pnpm generate`
// Example imports (uncomment after generation):

// import { useFindPetsByStatus } from './gen/hooks/useFindPetsByStatus'
// import { findPetsByStatusQueryOptions } from './gen/hooks/findPetsByStatusQueryOptions'

/**
 * Example: Using the generated query hook
 * 
 * The custom generator adds performance timing to all queries:
 * 
 * ```typescript
 * import { useFindPetsByStatus } from './gen/hooks/useFindPetsByStatus'
 * 
 * function PetsList() {
 *   const { data, isLoading } = useFindPetsByStatus({
 *     params: { status: 'available' }
 *   })
 *   
 *   // Console will show: [perf] findPetsByStatus: 45.2ms
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   return <div>{data?.map(pet => pet.name)}</div>
 * }
 * ```
 */

/**
 * Example: Using query options with TanStack Query
 * 
 * ```typescript
 * import { useQuery } from '@tanstack/react-query'
 * import { findPetsByStatusQueryOptions } from './gen/hooks/findPetsByStatusQueryOptions'
 * 
 * function PetsListWithOptions() {
 *   const query = useQuery({
 *     ...findPetsByStatusQueryOptions({ params: { status: 'available' } }),
 *     staleTime: 60000, // Add custom options
 *   })
 *   
 *   return <div>{query.data?.map(pet => pet.name)}</div>
 * }
 * ```
 */

/**
 * Example: Infinite queries with pagination
 * 
 * If your OpenAPI spec has list endpoints, the generator creates infinite query hooks:
 * 
 * ```typescript
 * import { useInfiniteFindPetsByStatus } from './gen/hooks/useInfiniteFindPetsByStatus'
 * 
 * function InfinitePetsList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteFindPetsByStatus({
 *     params: { status: 'available' }
 *   })
 *   
 *   return (
 *     <div>
 *       {data?.pages.map((page, i) => (
 *         <div key={i}>
 *           {page.data?.map(pet => pet.name)}
 *         </div>
 *       ))}
 *       <button 
 *         onClick={() => fetchNextPage()}
 *         disabled={!hasNextPage || isFetchingNextPage}
 *       >
 *         Load More
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * Example: File uploads with FormData
 * 
 * The generator automatically handles multipart/form-data:
 * 
 * ```typescript
 * import { useUploadFile } from './gen/hooks/useUploadFile'
 * 
 * function FileUpload() {
 *   const mutation = useUploadFile()
 *   
 *   const handleUpload = (file: File) => {
 *     mutation.mutate({
 *       data: {
 *         file,
 *         name: 'my-file.jpg',
 *       }
 *     })
 *   }
 *   
 *   return <input type="file" onChange={e => handleUpload(e.target.files[0])} />
 * }
 * ```
 */

export {}
