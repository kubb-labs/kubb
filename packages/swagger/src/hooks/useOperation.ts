import { useContext } from 'react'

import { AppContext } from '@kubb/react-template'

import type { AppContextProps } from '@kubb/react-template'
import type { Operation } from '@kubb/swagger'
import type { AppMeta } from '../types.ts'

export function useOperation(): Operation {
  const context = useContext(AppContext) as AppContextProps<AppMeta>
  return context.meta.operation
}
