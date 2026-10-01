export const LOG_LEVEL = Object.freeze({
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
})

export const LOG_MESSAGE = Object.freeze({
  SERVER_READY: 'Backend ready; MySQL connected',
  SERVER_START_FAILED: 'Backend startup failed',
  SERVER_STOPPING: 'Backend shutting down',
  SERVER_STOPPED: 'Backend stopped',
  SERVER_STOP_FAILED: 'Backend shutdown failed',
  HTTP_COMPLETED: 'HTTP request completed',
  HTTP_FAILED: 'HTTP request failed',
  LOG_SERIALIZE_FAILED: 'Logger could not serialize entry',
  LOG_WRITE_FAILED: 'Logger could not write file',
})
