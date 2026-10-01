import { appendFile, mkdir } from 'node:fs/promises'
import { LOG_LEVEL, LOG_MESSAGE } from '../../constants/logConstants.js'
import { HTTP_STATUS } from '../../constants/responseConstants.js'
import { getErrorDescriptor } from '../../utils/apiError.js'

const directory = new URL('../../logs/', import.meta.url)
let pending = Promise.resolve()
const loggedErrors = new WeakSet()

function serialize(key, value) {
  if (/password|passwd|secret|token|authorization|cookie/i.test(key)) return '[REDACTED]'
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: value.code, stack: value.stack }
  }
  if (typeof value === 'bigint') return value.toString()
  return value
}

function write(level, message, context = {}) {
  const timestamp = new Date().toISOString()
  let line
  try {
    line = JSON.stringify({ timestamp, level, message, context }, serialize)
  } catch {
    console.error(LOG_MESSAGE.LOG_SERIALIZE_FAILED)
    return Promise.resolve()
  }

  const print = level === LOG_LEVEL.ERROR ? console.error : level === LOG_LEVEL.WARN ? console.warn : console.log
  print(line)

  // Serialize asynchronous writes to preserve ordering without blocking requests.
  pending = pending.then(async () => {
    await mkdir(directory, { recursive: true })
    await appendFile(new URL(`${timestamp.slice(0, 10)}.log`, directory), line + '\n', 'utf8')
  }).catch(error => {
    console.error(LOG_MESSAGE.LOG_WRITE_FAILED, error.code ?? error.name)
  })
  return pending
}

function logError(error, operation, req) {
  // The same error may cross repository, service and controller catches.
  if (error && typeof error === 'object') {
    if (loggedErrors.has(error)) return Promise.resolve()
    loggedErrors.add(error)
  }
  const descriptor = getErrorDescriptor(error)
  const level = descriptor.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN
  return logger[level](operation, {
    code: descriptor.code, name: error?.name,
    causeCode: error?.original?.code ?? error?.cause?.code ?? error?.code,
    method: req?.method, path: req?.originalUrl?.split('?')[0],
    stack: error?.stack?.split('\n').filter(line => /^\s+at /.test(line)).join('\n'),
  })
}

const logger = {
  logError,
  info: (message, context) => write(LOG_LEVEL.INFO, message, context),
  warn: (message, context) => write(LOG_LEVEL.WARN, message, context),
  error: (message, context) => write(LOG_LEVEL.ERROR, message, context),
  debug: (message, context) => write(LOG_LEVEL.DEBUG, message, context),
  flush: () => pending,
}

export default logger
