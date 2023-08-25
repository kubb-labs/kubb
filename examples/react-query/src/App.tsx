import { useListPetsHook } from './gen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function Pets(): JSX.Element {
  const { data: pets } = useListPetsHook({})

  return (
    <>
      <h1>Pets:</h1>
      <ul>{pets?.map((pet) => <li key={pet.id}>{pet.name}</li>)}</ul>
    </>
  )
}

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <Pets />
    </QueryClientProvider>
  )
}
