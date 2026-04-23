import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const MONGODB_DB = process.env.MONGODB_DB || 'gambling'

async function seed() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)

  console.log('🌱 Seeding database...')

  // Drop existing collections
  await db.collection('users').deleteMany({})
  await db.collection('matches').deleteMany({})
  await db.collection('bets').deleteMany({})
  await db.collection('magic_tokens').deleteMany({})

  // Create users
  const adminId = new ObjectId()
  const aliceId = new ObjectId()
  const bobId = new ObjectId()
  const carolId = new ObjectId()

  await db.collection('users').insertMany([
    { _id: adminId, email: 'admin@gambling.local', role: 'admin', balanceCents: 0, createdAt: new Date() },
    { _id: aliceId, email: 'alice@gambling.local', role: 'user', balanceCents: 0, createdAt: new Date() },
    { _id: bobId, email: 'bob@gambling.local', role: 'user', balanceCents: 0, createdAt: new Date() },
    { _id: carolId, email: 'carol@gambling.local', role: 'user', balanceCents: 0, createdAt: new Date() },
  ])
  console.log('✅ Users created')

  // Create matches
  const match1Id = new ObjectId()
  const match2Id = new ObjectId()
  const match3Id = new ObjectId()

  const now = new Date()
  const yesterday = new Date(Date.now() - 86400000)

  await db.collection('matches').insertMany([
    {
      _id: match1Id,
      team1: 'Real Madrid',
      team2: 'Barcelona',
      status: 'open',
      result: null,
      createdAt: now,
      closedAt: null,
      settledAt: null,
    },
    {
      _id: match2Id,
      team1: 'Atlético',
      team2: 'Sevilla',
      status: 'settled',
      result: 'team1',
      createdAt: yesterday,
      closedAt: yesterday,
      settledAt: yesterday,
    },
    {
      _id: match3Id,
      team1: 'PSG',
      team2: 'Bayern',
      status: 'closed',
      result: null,
      createdAt: yesterday,
      closedAt: now,
      settledAt: null,
    },
  ])
  console.log('✅ Matches created')

  // Create bets for settled match
  // Atlético won (team1)
  // Alice bet on team1 (won), Bob bet on team2 (lost), Carol bet on draw (lost)
  const totalPot = 500_00 + 200_00 + 150_00 // 850€
  const winnersPot = 500_00
  const alicePayout = Math.floor((500_00 / winnersPot) * totalPot) // 850€

  await db.collection('bets').insertMany([
    {
      _id: new ObjectId(),
      matchId: match2Id,
      userId: aliceId,
      pick: 'team1',
      amountCents: 500_00,
      status: 'won',
      payoutCents: alicePayout,
      redsysOrderId: 'SEED000000001',
      createdAt: yesterday,
    },
    {
      _id: new ObjectId(),
      matchId: match2Id,
      userId: bobId,
      pick: 'team2',
      amountCents: 200_00,
      status: 'lost',
      payoutCents: 0,
      redsysOrderId: 'SEED000000002',
      createdAt: yesterday,
    },
    {
      _id: new ObjectId(),
      matchId: match2Id,
      userId: carolId,
      pick: 'draw',
      amountCents: 150_00,
      status: 'lost',
      payoutCents: 0,
      redsysOrderId: 'SEED000000003',
      createdAt: yesterday,
    },
    // Bets for closed match (PSG vs Bayern)
    {
      _id: new ObjectId(),
      matchId: match3Id,
      userId: aliceId,
      pick: 'team1',
      amountCents: 300_00,
      status: 'pending',
      payoutCents: null,
      redsysOrderId: 'SEED000000004',
      createdAt: yesterday,
    },
    {
      _id: new ObjectId(),
      matchId: match3Id,
      userId: bobId,
      pick: 'team2',
      amountCents: 100_00,
      status: 'pending',
      payoutCents: null,
      redsysOrderId: 'SEED000000005',
      createdAt: yesterday,
    },
  ])
  console.log('✅ Bets created')

  // Update alice balance (she won)
  await db.collection('users').updateOne({ _id: aliceId }, { $set: { balanceCents: alicePayout } })

  // Create indexes
  await db.collection('bets').createIndex({ matchId: 1 })
  await db.collection('bets').createIndex({ userId: 1 })
  await db.collection('bets').createIndex({ redsysOrderId: 1 }, { unique: true })
  await db.collection('magic_tokens').createIndex({ token: 1 }, { unique: true })
  await db.collection('magic_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

  console.log('✅ Indexes created')
  console.log('\n🎉 Seed complete!')
  console.log('\nUsers:')
  console.log('  admin@gambling.local (admin)')
  console.log('  alice@gambling.local (user) - balance:', (alicePayout / 100).toFixed(2) + '€')
  console.log('  bob@gambling.local (user)')
  console.log('  carol@gambling.local (user)')

  await client.close()
}

seed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
