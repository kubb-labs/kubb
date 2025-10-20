import './globals.ts'

import * as React from 'react'

export { Const, File, Function, Type, useFile, useLifecycle } from '@kubb/react-fabric'
export { App } from './components/App.tsx'
export { createRoot } from './createRoot.ts'
export { useApp } from './hooks/useApp.ts'
export { createFunctionParams, FunctionParams } from './utils/getFunctionParams.ts'

export const createContext = React.createContext
export const createElement = React.createElement
export const useContext = React.useContext
export const useEffect = React.useEffect
export const useState = React.useState
export const useRef = React.useRef
export const use = React.use
export const useReducer = React.useReducer
