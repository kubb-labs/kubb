import { useListPets } from './gen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './mocks/index.ts'

const queryClient = new QueryClient()

function Pets(): JSX.Element {
  const { data: pets } = useListPets({})

  return (
    <>
      <h1>Pets:</h1>
      <ul>
        {pets?.map((pet) => (
          <li key={pet.id}>{pet.name}</li>
        ))}
      </ul>
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
