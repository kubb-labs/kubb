import { describe, expect, it } from 'vitest'
import { isPublicAddress } from './publicAddress.ts'

describe('isPublicAddress', () => {
  it.each(['8.8.8.8', '93.184.216.34', '2606:4700:4700::1111'])('allows %s', (address) => expect(isPublicAddress(address)).toBe(true))

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    'not an ip',
  ])('refuses %s', (address) => expect(isPublicAddress(address)).toBe(false))
})
