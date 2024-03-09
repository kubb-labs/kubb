import { QueryClient, useQueryClient } from '@tanstack/react-query'
import type { Invalidations } from './gen/invalidations.ts'

const getInvalidationForMutation = <T extends keyof Invalidations = keyof Invalidations>({
  mutationName,
  queryClient,
}: {
  mutationName: T
  queryClient: QueryClient
}) => {
  const invalidations: Partial<Invalidations> = {
    useAddPetHook: () => {
      queryClient.invalidateQueries({
        queryKey: ['invalidate some queries'],
      })
    },
    // ...developers can add more invalidations, possibly query cache updates
  }

  return invalidations[mutationName]
}

export const useInvalidationForMutation = <T extends keyof Invalidations = keyof Invalidations>(
  mutationName: T,
) => {
  const queryClient = useQueryClient()

  return getInvalidationForMutation({ mutationName, queryClient })
}
