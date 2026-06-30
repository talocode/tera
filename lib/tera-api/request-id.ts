import { randomUUID } from 'node:crypto'

export function makeRequestId(): string {
  return `tera_req_${randomUUID().replace(/-/g, '').slice(0, 16)}`
}
