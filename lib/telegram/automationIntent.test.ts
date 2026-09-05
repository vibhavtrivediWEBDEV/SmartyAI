import { describe, expect, it } from 'vitest'
import { executeIntent } from '../executeIntent'
import { resolveUserIntent } from '../resolveUserIntent'

describe('Telegram automation intent', () => {
  it('resolves open youtube to a desktop open sequence', async () => {
    const intent = await resolveUserIntent('open youtube', { source: 'telegram' })
    const sequence = executeIntent(intent)

    expect(intent.intent).toBe('youtube.open')
    expect(sequence[0]).toMatchObject({ action: 'open', target: 'Youtube' })
  })
})
