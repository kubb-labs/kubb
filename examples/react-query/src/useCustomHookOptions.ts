import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { getUserByNameQueryKey, type HookOptions } from './gen/index.ts'

function getCustomHookOptions({ queryClient }: { queryClient: QueryClient }): Partial<HookOptions> {
  return {
    useUpdatePetHook: {
      onSuccess: () => {
        // Invalidate queries using a constant
        void queryClient.invalidateQueries({ queryKey: ['pet'] })
      },
    },
    useDeletePetHook: {
      onSuccess: (_data, variables, _onMutateResult, _context) => {
        // Invalidate queries using the provided variables
        void queryClient.invalidateQueries({ queryKey: ['pet', variables.pet_id] })
      },
    },
    useUpdateUserHook: {
      onSuccess: (_data, variables, _onMutateResult, _context) => {
        // Invalidate queries using the provided query key generator function
        void queryClient.invalidateQueries({ queryKey: getUserByNameQueryKey({ username: variables.username }) })
      },
    },
    useDeleteUserHook: {
      onError: (error, _variables, _onMutateResult, _context) => {
        // Implement custom error handling logic
        console.error('Failed to delete user:', error)
      },
    },
    // Add more custom hook options here...
  }
}

export function useCustomHookOptions<T extends keyof HookOptions>({ hookName, operationId }: { hookName: T; operationId: string }): HookOptions[T] {
  const queryClient = useQueryClient()
  const customOptions = getCustomHookOptions({ queryClient })
  return customOptions[hookName] ?? {}
}
