/* eslint-disable import/order */

// eslint-disable-next-line import/no-unassigned-import
import './devtools-window-polyfill.ts';

// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import devtools from 'react-devtools-core'
// //
// // // // eslint-disable-next-line @typescript-eslint/no-unsafe-call
// (devtools as any).connectToDevTools();

export default devtools
