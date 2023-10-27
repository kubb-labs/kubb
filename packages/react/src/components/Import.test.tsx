import { createRoot } from '../client/createRoot.ts'
import { Import } from './Import.tsx'

describe('<Import/>', () => {
  test('render Import with print', () => {
    const Component = () => {
      return <Import name="React" path="react" print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('import React from "react"')
  })

  test('render Import with print and type', () => {
    const Component = () => {
      return <Import name="React" path="react" isTypeOnly print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('import type React from "react"')
  })

  test('render Import with root', () => {
    const Component = () => {
      return <Import name="React" root="types" path="types/test" print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('import React from "./test"')
  })
})
