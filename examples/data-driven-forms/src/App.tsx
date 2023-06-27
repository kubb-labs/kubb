import './styles.css'

import { CreatePetsForm, CreatePetsBreedForm } from './gen/index.ts'

function Form(): JSX.Element {
  return (
    <>
      <h1>Pets form</h1>
      <CreatePetsForm onSubmit={(data) => console.log(data)} />
      <br />
      <br />

      <h1>Pets breed form</h1>
      <CreatePetsBreedForm breed="brits" onSubmit={(data) => console.log(data)} />
    </>
  )
}

export function App(): JSX.Element {
  return <Form />
}
