import path from 'path'
import Module from 'module'
import getCallerFile from 'get-caller-file'

type Mocks = {
  [key: string]: any
}

const _Module: any = Module
const originalLoad = _Module._load
const mocked = new Map<string, Mocks>()

const getMocks = (meta) => {
  if (mocked.has(meta.filename)) {
    return mocked.get(meta.filename)
  }

  if (meta.parent !== null) {
    return getMocks(meta.parent)
  }

  return null
}

export const mock = (file: string, mocks: Mocks) => {
  const callerDir = path.dirname(getCallerFile())
  const targetFile = path.resolve(callerDir, file)
  const fullPath = _Module._resolveFilename(targetFile)

  mocked.set(fullPath, mocks)

  if (mocked.size === 1) {
    _Module._load = (request, meta, ...rest) => {
      const mocks = getMocks(meta)

      if (mocks !== null && Reflect.has(mocks, request)) {
        return mocks[request]
      }

      return originalLoad(request, meta, ...rest)
    }
  }
}

const isCacheRelated = (target, meta) => {
  if (target === meta.filename) {
    return true
  }

  if (meta.parent !== null) {
    return isCacheRelated(target, meta.parent)
  }

  return false
}

export const unmock = (file: string) => {
  const callerDir = path.dirname(getCallerFile())
  const targetFile = path.resolve(callerDir, file)
  const fullPath = _Module._resolveFilename(targetFile)

  _Module._cache = Object.keys(_Module._cache).reduce((result, key) => {
    const meta = _Module._cache[key]

    if (!isCacheRelated(fullPath, meta)) {
      result[key] = meta
    }

    return result
  }, {})

  mocked.delete(fullPath)

  if (mocked.size === 0) {
    _Module._load = originalLoad
  }
}
