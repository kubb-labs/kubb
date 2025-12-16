import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import type { HookOptions } from './gen'

const getCustomHookOptions = ({ queryClient }: { queryClient: QueryClient }): Partial<HookOptions> => {
  return {
    useAddPetHook: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['invalidate some queries'] })
      },
    },
    // ...developers can define the custom options of multiple hooks
  }
}

export const useCustomHookOptions = <T extends keyof HookOptions>({ hookName }: { hookName: T }): HookOptions[T] => {
  const queryClient = useQueryClient()
  const customOptions = getCustomHookOptions({ queryClient })
  return customOptions[hookName] ?? {}
}
