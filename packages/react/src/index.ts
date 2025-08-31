import './globals.ts'

import * as React from 'react'

export { App } from './components/App.tsx'
export { Const } from './components/Const.tsx'
export { File } from './components/File.tsx'
export { Function } from './components/Function.tsx'
export { Indent } from './components/Indent.tsx'
export { Text } from './components/Text.tsx'
export { Type } from './components/Type.tsx'
export { createRoot } from './createRoot.ts'
export { useApp } from './hooks/useApp.ts'
export { useFile } from './hooks/useFile.ts'
export { useLifecycle } from './hooks/useLifecycle.tsx'
export { createFunctionParams, FunctionParams } from './utils/getFunctionParams.ts'

export const createContext = React.createContext
export const createElement = React.createElement
export const useContext = React.useContext
export const useEffect = React.useEffect
export const useState = React.useState
export const useRef = React.useRef
export const use = React.use
export const useReducer = React.useReducer
