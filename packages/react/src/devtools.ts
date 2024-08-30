import { execa } from 'execa'
// @ts-ignore
import devtools from 'react-devtools-core'

function openDevtools() {
  console.log("Opening devtools")
  execa({preferLocal: true, detached: true,  })`npx react-devtools`;
  
  console.log("Connecting devtools")
  devtools.connectToDevTools()
}

openDevtools()


