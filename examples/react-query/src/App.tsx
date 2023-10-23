import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

import { useFindPetsByStatusHook } from './gen'

import type { FindPetsByStatusQueryParamsStatus } from './gen'

const queryClient = new QueryClient()

function Pets(): JSX.Element {
  const [status, setStatus] = useState<FindPetsByStatusQueryParamsStatus>('available')
  const { data: pets } = useFindPetsByStatusHook({ status }, { query: { enabled: true } })

  return (
    <>
      <h1>Pets: {status}</h1>
      <ul>{pets?.map((pet) => <li key={pet.id}>{pet.name}</li>)}</ul>
      <button onClick={() => setStatus('available')}>Available</button>
      <button onClick={() => setStatus('pending')}>Pending</button>
    </>
  )
}

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <Pets />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
