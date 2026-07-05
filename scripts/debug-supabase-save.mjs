import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path = '.env') {
  const content = fs.readFileSync(path, 'utf8')
  const lines = content.split(/\r?\n/)
  const env = {}
  for (const line of lines) {
    const m = line.match(/^(VITE_[A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

async function main() {
  const env = loadEnv(new URL('../.env', import.meta.url).pathname)
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Try signing in as a seeded family account (password from seed: "Crushers")
  const email = 'evanbelfi@gmail.com'
  const password = 'Crushers'

  console.log('Signing in as', email)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  console.log('signIn error:', signInError)

  // List an active weekend
  const { data: weekends, error: weekendsError } = await supabase.from('availability_weekends').select('id').eq('is_active', true).limit(1)
  console.log('weekends error:', weekendsError)
  console.log('weekends:', weekends)

  // Find Luke Belfi player id
  const { data: players, error: playersError } = await supabase.from('players').select('id, first_name, last_name').eq('first_name', 'Luke').eq('last_name', 'Belfi').limit(1)
  console.log('players error:', playersError)
  console.log('players:', players)

  if (!weekends || weekends.length === 0 || !players || players.length === 0) {
    console.error('Missing weekend or player to test')
    process.exit(2)
  }

  const weekendId = weekends[0].id
  const playerId = players[0].id

  console.log('Attempting upsert for weekend:', weekendId, 'player:', playerId)

  const { data, error } = await supabase
    .from('availability_responses')
    .upsert({ weekend_id: weekendId, player_id: playerId, response: 'no' }, { onConflict: 'weekend_id,player_id' })

  console.log('upsert data:', data)
  console.log('upsert error:', error)

  // Verify select
  const { data: verify, error: verifyError } = await supabase.from('availability_responses').select('*').eq('weekend_id', weekendId).eq('player_id', playerId).single()
  console.log('verify data:', verify)
  console.log('verify error:', verifyError)
}

main().catch((err) => { console.error(err); process.exit(1) })
