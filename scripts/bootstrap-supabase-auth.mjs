#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const defaultPassword = process.env.DEFAULT_PARENT_PASSWORD ?? 'Crushers'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables.')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('Optional: DEFAULT_PARENT_PASSWORD')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function getExistingAuthEmails() {
  const emails = new Set()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`)
    }

    for (const user of data.users ?? []) {
      if (user.email) {
        emails.add(user.email.toLowerCase())
      }
    }

    const loadedCount = page * perPage
    if (!data.users || data.users.length < perPage || loadedCount >= data.total) {
      break
    }

    page += 1
  }

  return emails
}

async function getFamilies() {
  const { data, error } = await supabase
    .from('families')
    .select('id, email')
    .order('email', { ascending: true })

  if (error) {
    throw new Error(`Unable to read families table: ${error.message}`)
  }

  return (data ?? []).filter((family) => Boolean(family.email))
}

async function createAuthUser(email) {
  return supabase.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
  })
}

async function main() {
  const [families, existingEmails] = await Promise.all([
    getFamilies(),
    getExistingAuthEmails(),
  ])

  const summary = {
    created: [],
    alreadyExisted: [],
    failed: [],
  }

  for (const family of families) {
    const email = family.email.trim().toLowerCase()

    if (existingEmails.has(email)) {
      summary.alreadyExisted.push(email)
      continue
    }

    const { error } = await createAuthUser(email)

    if (error) {
      summary.failed.push({ email, error: error.message })
      continue
    }

    existingEmails.add(email)
    summary.created.push(email)
  }

  console.log('Supabase Auth bootstrap complete.')
  console.log(`Created: ${summary.created.length}`)
  for (const email of summary.created) {
    console.log(`  + ${email}`)
  }

  console.log(`Already existed: ${summary.alreadyExisted.length}`)
  for (const email of summary.alreadyExisted) {
    console.log(`  = ${email}`)
  }

  console.log(`Failed: ${summary.failed.length}`)
  for (const failure of summary.failed) {
    console.log(`  ! ${failure.email}: ${failure.error}`)
  }

  if (summary.failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
