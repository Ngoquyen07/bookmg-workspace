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
    [field === 'all' || field === 'subject' ? 'q' : field]: field === 'subject'
      ? `subject:"${q.replace(/[\\"]/g, '\\$&')}"` : q,
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

export async function getWork(workId) {
  return request(`${OPEN_LIBRARY_URLS.WORKS}${workId}.json`, async response => {
    const work = await response.json()
    if (work?.key !== `/works/${workId}` || typeof work.title !== 'string' || !work.title.trim() || work.title.length > 500) {
      throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
    }
    const authorKeys = Array.isArray(work.authors)
      ? work.authors.map(item => item?.author?.key).filter(key => /^\/authors\/OL\d+A$/.test(key))
      : []
    const authors = await Promise.all([...new Set(authorKeys)].map(async key => {
      return request(`${OPEN_LIBRARY_URLS.AUTHORS}${key.slice('/authors/'.length)}.json`, async authorResponse => {
        const author = await authorResponse.json()
        if (typeof author?.name !== 'string' || !author.name.trim()) throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
        return author.name
      })
    }))
    const year = typeof work.first_publish_date === 'string' ? Number(work.first_publish_date.match(/\b\d{4}\b/)?.[0]) : null
    const coverId = Array.isArray(work.covers) ? work.covers.map(id => positiveInteger(id, 4294967295)).find(Boolean) ?? null : null
    const description = typeof work.description === 'string' ? work.description : work.description?.value
    return {
      id: workId, title: work.title, authors, coverId,
      firstPublishYear: positiveInteger(year, 65535),
      description: typeof description === 'string' ? description : null,
      subjects: Array.isArray(work.subjects) ? work.subjects.filter(item => typeof item === 'string') : [],
    }
  }, API_ERRORS.BOOK_NOT_FOUND)
}

export async function getEdition(editionId, workId) {
  return request(`${OPEN_LIBRARY_URLS.BOOKS}${editionId}.json`, async response => {
    const edition = await response.json()
    if (edition?.key !== `/books/${editionId}` || !Array.isArray(edition.works) ||
        !edition.works.some(item => item?.key === `/works/${workId}`)) {
      throw new ApiError(API_ERRORS.VALIDATION_ERROR)
    }
    return { editionId, totalPages: positiveInteger(edition.number_of_pages, 4294967295) }
  }, API_ERRORS.VALIDATION_ERROR)
}

export async function getSuggestedEdition(workId) {
  return request(`${OPEN_LIBRARY_URLS.WORKS}${workId}/editions.json?limit=50`, async response => {
    const result = await response.json()
    if (!Array.isArray(result?.entries)) throw new ApiError(API_ERRORS.OPEN_LIBRARY_ERROR)
    const edition = result.entries.find(item =>
      /^\/books\/OL\d+M$/.test(item?.key) && positiveInteger(item.number_of_pages, 4294967295),
    )
    return edition ? {
      editionId: edition.key.slice('/books/'.length),
      totalPages: edition.number_of_pages,
    } : { editionId: null, totalPages: null }
  })
}
