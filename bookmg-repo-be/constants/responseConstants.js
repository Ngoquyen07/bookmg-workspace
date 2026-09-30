export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  GATEWAY_TIMEOUT: 504,
})

export const API_ERRORS = Object.freeze({
  ROUTE_NOT_FOUND: Object.freeze({
    status: HTTP_STATUS.NOT_FOUND, code: 'ROUTE_NOT_FOUND', message: 'Route not found',
  }),
  INVALID_JSON: Object.freeze({
    status: HTTP_STATUS.BAD_REQUEST, code: 'INVALID_JSON', message: 'Invalid JSON body',
  }),
  PAYLOAD_TOO_LARGE: Object.freeze({
    status: HTTP_STATUS.PAYLOAD_TOO_LARGE, code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large',
  }),
  VALIDATION_ERROR: Object.freeze({
    status: HTTP_STATUS.BAD_REQUEST, code: 'VALIDATION_ERROR', message: 'Invalid request data',
  }),
  BOOK_NOT_FOUND: Object.freeze({
    status: HTTP_STATUS.NOT_FOUND, code: 'BOOK_NOT_FOUND', message: 'Book not found',
  }),
  COVER_NOT_FOUND: Object.freeze({
    status: HTTP_STATUS.NOT_FOUND, code: 'COVER_NOT_FOUND', message: 'Cover not found',
  }),
  BOOK_ALREADY_IN_SHELF: Object.freeze({
    status: HTTP_STATUS.CONFLICT, code: 'BOOK_ALREADY_IN_SHELF', message: 'Book is already in the shelf',
  }),
  OPEN_LIBRARY_ERROR: Object.freeze({
    status: HTTP_STATUS.BAD_GATEWAY, code: 'OPEN_LIBRARY_ERROR', message: 'Unable to retrieve Open Library data',
  }),
  OPEN_LIBRARY_TIMEOUT: Object.freeze({
    status: HTTP_STATUS.GATEWAY_TIMEOUT, code: 'OPEN_LIBRARY_TIMEOUT', message: 'Open Library request timed out',
  }),
  INTERNAL_SERVER_ERROR: Object.freeze({
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error',
  }),
})
