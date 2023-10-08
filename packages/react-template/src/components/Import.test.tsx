import { render } from '../render.ts'
import { Import } from './Import.tsx'

describe('<Import/>', () => {
  test('render Import with print', () => {
    const Component = () => {
      return <Import name="React" path="react" print />
    }
    const { output } = render(<Component />)
    expect(output).toMatch('import React from "react"')
  })
  test('render Import without print', () => {
    const Component = () => {
      return <Import name="React" path="react" />
    }
    const { imports } = render(<Component />)
    expect(imports).toStrictEqual([{ isTypeOnly: undefined, name: 'React', path: 'react' }])
  })
})
