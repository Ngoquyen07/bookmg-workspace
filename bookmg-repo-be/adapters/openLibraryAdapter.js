import { API_ERRORS } from '../constants/responseConstants.js'
import { OPEN_LIBRARY_URLS } from '../constants/openLibraryConstants.js'
import ApiError from '../utils/apiError.js'
import logger from '../services/core/loggerService.js'

const TIMEOUT_MS = 10_000

async function request(url, read, notFound) {
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'MiniReadingTracker/1.0' },
    })
    if (response.status === 404 && notFound) throw new ApiError(notFound)
    if (!response.ok) throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
    return await read(response)
  } catch (error) {
    const failure = error instanceof ApiError ? error : new ApiError(
      signal.aborted || error.name === 'TimeoutError' ? API_ERRORS.OPEN_LIBRARY_TIMEOUT : API_ERRORS.OPEN_LIBRARY_ERROR,
      { cause: error },
    )
    logger.logError(failure, 'openLibraryAdapter.request')
    throw failure
  }
}

function positiveInteger(value, maximum) {
  return Number.isInteger(value) && value > 0 && value <= maximum ? value : null
}

export async function searchBooks({ q, field, page, limit }) {
  const url = new URL(OPEN_LIBRARY_URLS.SEARCH)
  url.search = new URLSearchParams({
    [field === 'all' ? 'q' : field]: q,
    page: String(page), limit: String(limit),
    fields: 'key,title,author_name,cover_i,first_publish_year',
  }).toString()
  return request(url, async response => {
    const result = await response.json()
    const total = result?.numFound ?? result?.num_found
    if (!Number.isSafeInteger(total) || total < 0 || !Array.isArray(result?.docs)) {
      throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
    }
    const books = result.docs.map(doc => {
      const id = typeof doc?.key === 'string' ? doc.key.replace(/^\/works\//, '') : ''
      if (!/^OL\d+W$/.test(id) || id.length > 32 || typeof doc.title !== 'string' || !doc.title.trim()) {
        throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
      }
      const coverId = positiveInteger(doc.cover_i, 4294967295)
      return {
        id, title: doc.title,
        authors: Array.isArray(doc.author_name) ? doc.author_name.filter(name => typeof name === 'string') : [],
        coverId,
        coverUrl: coverId === null ? null : `/api/books/covers/${coverId}`,
        firstPublishYear: positiveInteger(doc.first_publish_year, 65535),
      }
    })
    return { books, total }
  })
}

export async function getCover(coverId) {
  return request(`${OPEN_LIBRARY_URLS.COVERS}${coverId}-M.jpg?default=false`, async response => {
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    const bytes = Buffer.from(await response.arrayBuffer())
    if (contentType !== 'image/jpeg' || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
    }
    return bytes
  }, API_ERRORS.COVER_NOT_FOUND)
}
