import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { HookOptions } from './gen/index.ts'

function getCustomHookOptions({ queryClient }: { queryClient: QueryClient }): Partial<HookOptions> {
  return {
    // TODO: Define custom hook options here
    // Example:
    // useUpdatePetHook: {
    //   onSuccess: () => {
    //     void queryClient.invalidateQueries({ queryKey: ['pet'] })
    //   }
    // }
  }
}
export function useCustomHookOptions<T extends keyof HookOptions>({ hookName }: { hookName: T }): HookOptions[T] {
  const queryClient = useQueryClient()
  const customOptions = getCustomHookOptions({ queryClient })
  return customOptions[hookName] ?? {}
}
