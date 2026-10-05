import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildSeed, type StoreData } from './seed.js'

const FILE = path.join(process.cwd(), 'data', 'accreditations.json')
const TMP = path.join('/tmp', 'afa-accreditations.json')
const REDIS_KEY = 'afa-accreditations'

let cache: StoreData | null = null
let queue: Promise<unknown> = Promise.resolve()

function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

async function redisCommand(command: (string | number)[]) {
  const env = redisEnv()
  if (!env) return null
  const res = await fetch(env.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  return (await res.json()) as { result?: string | null }
}

async function loadBlob(): Promise<StoreData | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null
  const { head } = await import('@vercel/blob')
  try {
    const meta = await head('afa-accreditations.json', { token })
    const res = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    return (await res.json()) as StoreData
  } catch {
    return null
  }
}

async function saveBlob(data: StoreData) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return false
  const { put } = await import('@vercel/blob')
  await put('afa-accreditations.json', JSON.stringify(data), {
    access: 'private',
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
  return true
}

async function readFileStore(): Promise<StoreData | null> {
  for (const file of [FILE, TMP]) {
    try {
      const raw = await readFile(file, 'utf8')
      return JSON.parse(raw) as StoreData
    } catch {
      // fichier absent ou illisible
    }
  }
  return null
}

async function writeFileStore(data: StoreData) {
  const payload = JSON.stringify(data, null, 2)
  try {
    await mkdir(path.dirname(FILE), { recursive: true })
    await writeFile(FILE, payload, 'utf8')
    return
  } catch {
    await writeFile(TMP, payload, 'utf8')
  }
}

async function load(): Promise<StoreData> {
  if (cache) return cache
  if (redisEnv()) {
    const got = await redisCommand(['GET', REDIS_KEY])
    if (got?.result) {
      cache = JSON.parse(got.result) as StoreData
      return cache
    }
  } else if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await loadBlob()
    if (blob) {
      cache = blob
      return cache
    }
  } else {
    const file = await readFileStore()
    if (file) {
      cache = file
      return cache
    }
  }
  cache = buildSeed()
  return cache
}

async function persist(data: StoreData) {
  cache = data
  if (redisEnv()) {
    await redisCommand(['SET', REDIS_KEY, JSON.stringify(data)])
    return
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await saveBlob(data)
    return
  }
  await writeFileStore(data)
}

export function withStore<T>(fn: (data: StoreData) => Promise<T> | T): Promise<T> {
  return locked(async () => {
    const data = await load()
    const result = await fn(data)
    return result
  })
}

export async function updateStore<T>(fn: (data: StoreData) => Promise<T> | T): Promise<T> {
  return locked(async () => {
    const data = await load()
    const result = await fn(data)
    await persist(data)
    return result
  })
}

export function snapshot(data: StoreData): StoreData {
  return clone(data)
}
