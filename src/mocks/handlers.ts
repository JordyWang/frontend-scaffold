import { http, HttpResponse } from 'msw'
import fixtures from '@/mocks/data/fixtures.json'
import tasks from '@/mocks/data/tasks.json'
import media from '@/mocks/data/media.json'
import errors from '@/mocks/data/errors.json'

export const handlers = [
  http.get('/api/dev/fixtures', () => HttpResponse.json(fixtures)),
  http.get('/api/dev/tasks', () => HttpResponse.json(tasks)),
  http.get('/api/dev/media', () => HttpResponse.json(media)),
  http.all('/api/*', () =>
    HttpResponse.json(errors.notConfigured, { status: 501 }),
  ),
]
