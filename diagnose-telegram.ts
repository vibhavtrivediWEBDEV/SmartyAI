/**
 * Quick Diagnostic - Check Telegram Logs in MongoDB
 */

import { config } from 'dotenv'
config()

import { MongoClient } from 'mongodb'

async function diagnose() {
  const uri = process.env.MONGODB_URI!
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db('hrms')
    const collection = db.collection('telegramLogs')

    console.log('\n🔍 DIAGNOSTIC: Checking Telegram Logs\n')

    // Get last 10 logs
    const logs = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    console.log(`Found ${logs.length} logs:\n`)

    logs.forEach((log, i) => {
      const icon = log.direction === 'incoming' ? '📩' : '📤'
      const time = log.timestamp?.toLocaleTimeString() || 'Unknown'
      const source = log.source || 'unknown'
      const message = log.message?.substring(0, 60) || ''
      const userId = log.userId?.substring(0, 8) || 'unknown'

      console.log(`${i + 1}. ${icon} [${time}] ${source.padEnd(10)} | User: ${userId}`)
      console.log(`   ${message}...`)
      console.log()
    })

    // Summary
    const incoming = logs.filter(l => l.direction === 'incoming').length
    const outgoing = logs.filter(l => l.direction === 'outgoing').length

    console.log('📊 Summary:')
    console.log(`   📥 Incoming: ${incoming}`)
    console.log(`   📤 Outgoing: ${outgoing}`)

    if (outgoing === 0) {
      console.log('\n⚠️  ISSUE: No outgoing messages!')
      console.log('   The bot is receiving but NOT sending responses.')
      console.log('   Check server logs for errors.')
    } else if (outgoing < incoming) {
      console.log('\n⚠️  ISSUE: Missing outgoing messages!')
      console.log(`   Received ${incoming} but only sent ${outgoing} responses.`)
    } else {
      console.log('\n✅ Bidirectional messaging looks good!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

diagnose()
