# ADR-001: MongoDB Singleton Client

## Status
Accepted

## Context
Next.js API routes run as serverless-style functions. In development (`next dev`) they are long-lived, but in production builds (Next.js standalone, Vercel, Docker) each route module is reloaded between cold starts. Without a shared client, every incoming HTTP request would open a new `MongoClient` connection.

MongoDB's default connection pool allows **100 concurrent connections per client**. A Next.js app under moderate load (50 req/s) creating a new client per request would exhaust the pool in under 2 seconds:

```
50 req/s × ~40ms avg DB latency = 2 concurrent connections/req
50 req/s × 100ms peak = up to 5 connections open simultaneously
Without singleton: each of the 50 req/s opens its own pool → 50 × 100 = 5,000 connections/s attempted
→ MongoDB refuses connections after pool limit is hit → 500 errors cascade
```

With a singleton client, the same 100 concurrent connections serve all requests:
- **Connection reuse latency**: ~1ms (pool checkout) vs ~300ms (TCP + TLS + auth handshake for a new connection)
- **Throughput**: constant at pool size; no connection exhaustion

## Decision
Export a single `MongoClient` instance from `lib/db.ts` and reuse it across all API routes. Use Node.js module caching as the singleton mechanism — the first `import` initialises the client; subsequent imports receive the cached export.

```ts
// lib/db.ts
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGODB_URI!)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise
```

In development, `global._mongoClientPromise` survives Hot Module Replacement reloads, preventing connection leaks during rapid file saves.

## Consequences

**Positive:**
- Eliminates connection exhaustion under load
- Reduces per-request latency by ~300ms on warm instances
- Single place to configure timeouts (`serverSelectionTimeoutMS`, `connectTimeoutMS`)

**Negative:**
- Global state makes unit testing harder — callers must mock `lib/db.ts` or use in-memory MongoDB
- Connection errors affect all routes simultaneously (no per-request isolation)

**Trade-offs:**
- The Node.js global trick (`global._mongoClientPromise`) is a well-known Next.js pattern. It is a workaround for HMR in dev mode, not idiomatic design.
