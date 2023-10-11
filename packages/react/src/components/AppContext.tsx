import { createContext } from 'react'

export type AppContextProps<Meta extends Record<string, unknown> = Record<string, unknown>> = {
  meta: Meta
}

export const AppContext = createContext<AppContextProps>({
  meta: {},
})
