import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!

let client: MongoClient
let db: Db

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
  // eslint-disable-next-line no-var
  var _mongoDb: Db | undefined
}

async function getDb(): Promise<Db> {
  if (global._mongoDb) return global._mongoDb

  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri)
    await global._mongoClient.connect()
  }

  client = global._mongoClient
  db = client.db(dbName)
  global._mongoDb = db

  // Create indexes
  await db.collection('bets').createIndex({ matchId: 1 })
  await db.collection('bets').createIndex({ userId: 1 })
  await db.collection('bets').createIndex({ redsysOrderId: 1 }, { unique: true })
  await db.collection('magic_tokens').createIndex({ token: 1 }, { unique: true })
  await db.collection('magic_tokens').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  )

  return db
}

export default getDb
