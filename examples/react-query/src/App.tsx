import { QueryClient, QueryClientProvider, useQueries } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { findPetsByStatusQueryOptionsHook, useFindPetsByStatusHook, useFindPetsByTagsInfiniteHook, useUpdatePetWithFormHook } from './gen/hooks/index.ts'
import type { FindPetsByStatusQueryParamsStatusEnum } from './gen/models'

const queryClient = new QueryClient()

function Pets(): JSX.Element {
  const [status, setStatus] = useState<FindPetsByStatusQueryParamsStatusEnum>('available')
  const { data: pets, queryKey } = useFindPetsByStatusHook({ status }, { query: { enabled: true } })
  const { data } = useUpdatePetWithFormHook(2)
  const { queryKey: _queryKey, initialData } = findPetsByStatusQueryOptionsHook()
  const statuses: FindPetsByStatusQueryParamsStatusEnum[] = ['available', 'pending']

  const queries = useQueries({
    queries: statuses.map((status) => findPetsByStatusQueryOptionsHook({ status })),
  })

  console.log(data)
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
  const { data: pagedPets } = useFindPetsByTagsInfiniteHook(
    {},
    {
      query: {
        getNextPageParam: (lastPage, pages) => {
          const numPages: number | undefined = lastPage.headers?.['x-pages']
          const nextPage = pages.length + 1
          return nextPage <= (numPages ?? 0) ? nextPage : undefined
        },
      },
    },
  )

  const { data: pagedPet } = useFindPetsByTagsInfiniteHook(
    {},
    {
      query: {
        getNextPageParam: (lastPage, pages) => {
          const numPages: number | undefined = lastPage.headers?.['x-pages']
          const nextPage = pages.length + 1
          return nextPage <= (numPages ?? 0) ? nextPage : undefined
        },
        // select(data) {
        //   return data.pages[0]?.data.at(0)
        // },
      },
    },
  )

  // console.log(pagedPets?.pages.at(0)?.data.at(0)?.id)
  //            ^?
  // console.log(pagedPet?.id)
  //            ^?
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
