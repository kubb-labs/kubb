import { QueryClient, useQueryClient } from '@tanstack/react-query'
import type { Invalidations } from './gen/invalidations.ts'

const getInvalidationForMutation = ({
  mutationName,
  queryClient,
}: {
  mutationName: keyof Invalidations
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

export const useInvalidationForMutation = (
  mutationName: keyof Invalidations,
) => {
  const queryClient = useQueryClient()

  return getInvalidationForMutation({ mutationName, queryClient })
}
