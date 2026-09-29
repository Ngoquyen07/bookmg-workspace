import { appendFile, mkdir } from 'node:fs/promises'
import { LOG_LEVEL, LOG_MESSAGE } from '../../constants/logConstants.js'

const directory = new URL('../../logs/', import.meta.url)
let pending = Promise.resolve()

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

const logger = {
  info: (message, context) => write(LOG_LEVEL.INFO, message, context),
  warn: (message, context) => write(LOG_LEVEL.WARN, message, context),
  error: (message, context) => write(LOG_LEVEL.ERROR, message, context),
  debug: (message, context) => write(LOG_LEVEL.DEBUG, message, context),
  flush: () => pending,
}

export default logger
