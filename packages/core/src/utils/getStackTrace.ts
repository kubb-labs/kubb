// eslint-disable-next-line @typescript-eslint/ban-types, no-undef
export function getStackTrace(belowFn?: Function): NodeJS.CallSite[] {
  const oldLimit = Error.stackTraceLimit
  Error.stackTraceLimit = Infinity

  const dummyObject = {} as any

  const v8Handler = Error.prepareStackTrace
  Error.prepareStackTrace = function prepareStackTrace(dummyObject, v8StackTrace) {
    return v8StackTrace
  }
  Error.captureStackTrace(dummyObject, belowFn || getStackTrace)

  const v8StackTrace = dummyObject.stack
  Error.prepareStackTrace = v8Handler
  Error.stackTraceLimit = oldLimit

  return v8StackTrace
}
