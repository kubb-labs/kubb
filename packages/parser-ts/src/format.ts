import { print } from "./print.ts";

export function format(source: string){


  // do some basic linting with the ts compiler
  return print([],{source, noEmitHelpers: false})
}
