type PermissionLevel = 'none' | 'read' | 'write'

type ConfigPermissions = {
  yolo?: true
  filesystem?: PermissionLevel
}

function maxLevel(a: PermissionLevel | undefined, b: PermissionLevel | undefined): PermissionLevel {
  const order: Record<PermissionLevel, number> = { none: 0, read: 1, write: 2 }
  return order[a ?? 'none'] >= order[b ?? 'none'] ? (a ?? 'none') : (b ?? 'none')
}

export function resolvePermissions({
  runtimeYolo,
  runtimeFilesystem,
  configPermissions,
}: {
  runtimeYolo: boolean
  runtimeFilesystem: PermissionLevel
  configPermissions: ConfigPermissions
}): { yolo: boolean; filesystem: PermissionLevel } {
  const configYolo = configPermissions.yolo === true
  const configFilesystem = configYolo ? (configPermissions.filesystem ?? 'write') : configPermissions.filesystem
  const filesystem = runtimeYolo ? 'write' : maxLevel(runtimeFilesystem, configFilesystem)

  return {
    yolo: runtimeYolo || configYolo,
    filesystem,
  }
}
