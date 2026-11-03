import net from 'node:net'

function createBlockList(): net.BlockList {
  const list = new net.BlockList()
  for (const [address, prefix] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['224.0.0.0', 3],
  ] as const) {
    list.addSubnet(address, prefix, 'ipv4')
  }
  for (const [address, prefix] of [
    ['::', 128],
    ['::1', 128],
    ['64:ff9b::', 96],
    ['fc00::', 7],
    ['fe80::', 10],
    ['ff00::', 8],
  ] as const) {
    list.addSubnet(address, prefix, 'ipv6')
  }
  return list
}

const privateAddresses = createBlockList()

/**
 * Whether `address` is a routable public IP. Loopback, private, link-local, cloud metadata, and
 * multicast ranges are not, and an IPv4-mapped IPv6 address counts as the IPv4 address it wraps.
 * Pass `blocked` to replace the ranges.
 */
export function isPublicAddress(address: string, blocked: net.BlockList = privateAddresses): boolean {
  const family = net.isIP(address)
  return family !== 0 && !blocked.check(address, family === 4 ? 'ipv4' : 'ipv6')
}
