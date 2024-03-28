import { QueryClient, QueryClientProvider, useQueries } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

import { findPetsByStatusQueryOptions, useFindPetsByStatusHook, useUpdatePetWithFormHook } from './gen'

import type { FindPetsByStatusQueryParamsStatus } from './gen'

const queryClient = new QueryClient()

function Pets(): JSX.Element {
  const [status, setStatus] = useState<FindPetsByStatusQueryParamsStatus>('available')
  const { mutateAsync } = useUpdatePetWithFormHook(2)
  const { data: pets, queryKey } = useFindPetsByStatusHook({ status }, { query: { enabled: true } })
  const { queryKey: _queryKey, initialData } = findPetsByStatusQueryOptions()
  const statuses: FindPetsByStatusQueryParamsStatus[] = ['available', 'pending']

  const queries = useQueries({
    queries: statuses.map((status) => findPetsByStatusQueryOptions({ status })),
  })

  console.log(mutateAsync)
  //            ^?

  console.log(pets)
  //            ^?

  console.log(initialData)
  //            ^?

  console.log(queryKey)
  //            ^?

  console.log(_queryKey)
  //            ^?

  console.log(queries)
  //            ^?

  const { data: firstPet, queryKey: firstQueryKey } = useFindPetsByStatusHook(
    { status: 'available' },
    {
      query: {
        queryKey: ['test'] as const,
        enabled: false,
        select: (data) => {
          const res = data.at(0)
          //    ^?
          return res
        },
      },
    },
  )

  console.log(firstPet)
  //            ^?

  console.log(firstQueryKey)
  //            ^?

  return (
    <>
      <h1>Pets: {status}</h1>
      <ul>
        {pets?.map((pet) => (
          <li key={pet.id}>{pet.name}</li>
        ))}
      </ul>
      <button type="button" onClick={() => setStatus('available')}>
        Available
      </button>
      <button type="button" onClick={() => setStatus('pending')}>
        Pending
      </button>
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
