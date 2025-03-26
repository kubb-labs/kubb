import { useState } from 'react'
import reactLogo from './assets/react.svg'
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import './App.css'
import {Progress, Button} from "@heroui/react";

const queryClient = new QueryClient()

function Status(){
  const {
    data
  } = useQuery({ queryKey: ['todos'], queryFn: async ()=>{
      const response = await fetch('/api/status');

      return response.json() as Promise<{percentage?: number}>

    },  refetchInterval: 1000, })

  return <>
    <Button color="primary">Button</Button>
    <Progress aria-label="Loading..." size="lg" value={data?.percentage} />
  <p>Status: {JSON.stringify(data, null,2 )}</p>
    </>
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <Status />
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </QueryClientProvider>
  )
}

export default App
