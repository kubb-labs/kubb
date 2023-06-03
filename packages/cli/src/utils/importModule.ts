import { pathToFileURL } from 'node:url'
import mod from 'node:module'

const SLASHES = new Set(['/', '\\'])

/**
 * Normalizes directories to have a trailing slash.
 * Resolve is pretty finicky -- if the directory name doesn't have
 * a trailing slash then it tries to look in the parent directory.
 * i.e., if the directory is "/usr/nzakas/foo" it will start the
 * search in /usr/nzakas. However, if the directory is "/user/nzakas/foo/",
 * then it will start the search in /user/nzakas/foo.
 * @param {string} directory The directory to check.
 * @returns {string} The normalized directory.
 */
function normalizeDirectory(directory: string) {
  if (!SLASHES.has(directory[directory.length - 1])) {
    return `${directory}/`
  }

  return directory
}

export async function importModule(path: string, cwd?: string) {
  let location = path

  if (cwd) {
    const require = mod.createRequire(normalizeDirectory(cwd))
    location = require.resolve(path)
  }

  const module = await import(pathToFileURL(location).href)

  return module.default
}
