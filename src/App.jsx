import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './components/Icon'
import {
  expenseMonths,
  monthlyExpenseReports,
  navItems,
  orderProducts,
  orderWindow,
} from './data/teamData'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'
import './App.css'

const familyEditFields = [
  ['name', 'Player name'],
  ['number', 'Jersey #'],
  ['bats', 'Bats'],
  ['throws', 'Throws'],
  ['catches', 'Catches'],
  ['birthdate', 'Birthdate'],
  ['dadName', 'Dad name'],
  ['dadPhone', 'Dad contact'],
  ['momName', 'Mom name'],
  ['momPhone', 'Mom contact'],
  ['parentEmail', 'Parent email'],
  ['password', 'Password'],
  ['allergies', 'Player allergies'],
  ['address', 'Address'],
]

const familyInfoFields = [
  ['dadName', 'Dad name'],
  ['dadPhone', 'Dad contact'],
  ['momName', 'Mom name'],
  ['momPhone', 'Mom contact'],
  ['parentEmail', 'Parent email'],
  ['address', 'Address'],
  ['password', 'Password'],
]

const APP_TO_DB_RESPONSE = {
  Yes: 'yes',
  No: 'no',
  'Sat Only': 'sat_only',
  'Sun Only': 'sun_only',
}

const DB_TO_APP_RESPONSE = {
  yes: 'Yes',
  no: 'No',
  sat_only: 'Sat Only',
  sun_only: 'Sun Only',
}

function AppShell({ activePage, children, setActivePage }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="app-corner-logo" src="/assets/scv-crushers-navy-logo.png" alt="SCV Crushers Navy logo" />
          <div>
            <p>SCV Crushers Navy</p>
            <h1>Team Hub</h1>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={activePage === item.id ? 'nav-item is-active' : 'nav-item'}
              key={item.id}
              onClick={() => setActivePage(item.id)}
              type="button"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="mobile-brand-lockup">
        <img className="app-corner-logo" src="/assets/scv-crushers-navy-logo.png" alt="SCV Crushers Navy logo" />
        <div>
          <p>SCV Crushers Navy</p>
          <h1>Team Hub</h1>
        </div>
      </div>

      <main className="content">{children}</main>

      <nav className="bottom-nav" aria-label="Mobile primary navigation">
        {navItems.map((item) => (
          <button
            className={activePage === item.id ? 'mobile-nav-item is-active' : 'mobile-nav-item'}
            key={item.id}
            onClick={() => setActivePage(item.id)}
            type="button"
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function AccountDropdown({ currentUser, onEditFamily, onSignOut }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const familyPlayers = currentUser.familyPlayers ?? []
  const hasMultiplePlayers = familyPlayers.length > 1

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  return (
    <div className="user-menu-wrap" ref={menuRef}>
      <button
        className="user-menu-button"
        type="button"
        aria-expanded={isUserMenuOpen}
        onClick={() => setIsUserMenuOpen((current) => !current)}
      >
        <Icon name="user" size={15} />
        Viewing for {currentUser.activePlayer.name}
        <span aria-hidden="true">⌄</span>
      </button>

      {isUserMenuOpen && (
        <div className="user-menu card">
          <div className="user-menu-account">
            <p>Viewing for: <strong>{currentUser.activePlayer.name}</strong></p>
            <p>Signed in as: <strong>{currentUser.email}</strong></p>
          </div>
          {hasMultiplePlayers && familyPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => {
                currentUser.setActivePlayerId(player.id)
                setIsUserMenuOpen(false)
              }}
            >
              View for {player.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false)
              onEditFamily()
            }}
          >
            Edit Family Information
          </button>
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false)
              onSignOut()
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

function PageHeader({ action, title, description }) {
  return (
    <header className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

function getResponseCounts(responses) {
  return responses.reduce(
    (counts, response) => {
      counts[response.status] += 1
      return counts
    },
    { Yes: 0, No: 0, 'Sat Only': 0, 'Sun Only': 0, 'No Response': 0 },
  )
}

function groupResponses(responses) {
  return {
    Yes: responses.filter((response) => response.status === 'Yes'),
    'Sat Only': responses.filter((response) => response.status === 'Sat Only'),
    'Sun Only': responses.filter((response) => response.status === 'Sun Only'),
    No: responses.filter((response) => response.status === 'No'),
    'No Response': responses.filter((response) => response.status === 'No Response'),
  }
}

function getResponseLabel(status) {
  return {
    'Sat Only': 'Saturday Only',
    'Sun Only': 'Sunday Only',
  }[status] ?? status
}

function getStatusClass(status) {
  return `status-${status.toLowerCase().replaceAll(' ', '-')}`
}

function getMonthTabs(weekends) {
  return weekends.reduce((months, weekend) => {
    const month = weekend.month
    return months.includes(month) ? months : [...months, month]
  }, [])
}

function getDefaultWeekendMonth(weekends) {
  if (weekends.length === 0) {
    return ''
  }

  const today = new Date()
  const upcomingWeekend = weekends
    .filter(({ startDate }) => startDate >= today)
    .sort((a, b) => a.startDate - b.startDate)[0]

  return upcomingWeekend?.month ?? weekends[0].month
}

function parseDatabaseDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`)
}

function formatWeekendRangeFromDatabase(startDateValue, endDateValue) {
  const startDate = parseDatabaseDate(startDateValue)
  const endDate = parseDatabaseDate(endDateValue)
  const startMonth = startDate.toLocaleString('en-US', { month: 'long' })
  const endMonth = endDate.toLocaleString('en-US', { month: 'long' })

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}–${endDate.getDate()}`
  }

  return `${startMonth} ${startDate.getDate()}–${endMonth} ${endDate.getDate()}`
}

function getPlayerName(player) {
  return `${player.first_name} ${player.last_name}`
}

function parseFamilyPlayer(player, familyId = null) {
  return {
    id: player.id,
    familyId,
    supabaseId: player.id,
    first_name: player.first_name,
    last_name: player.last_name,
    name: getPlayerName(player),
    number: player.jersey_number ?? '',
    bats: player.bats ?? '',
    throws: player.throws ?? '',
    catches: player.catches == null ? '' : player.catches ? 'Yes' : '',
    status: player.status,
    birthdate: player.player_private_details?.birthdate ?? '',
    allergies: player.player_private_details?.allergies ?? '',
    dadName: player.dad_name ?? '',
    dadPhone: player.dad_phone ?? '',
    momName: player.mom_name ?? '',
    momPhone: player.mom_phone ?? '',
    parentEmail: player.parent_email ?? '',
    address: player.address ?? '',
  }
}

const ADMIN_EMAILS = ['evanbelfi@gmail.com', 'dsddm3@gmail.com']

async function loadSupabaseCurrentUser(session) {
  if (!session?.user?.email) {
    return { user: null, error: null }
  }

  const email = session.user.email.trim().toLowerCase()
  const isAdminEmail = ADMIN_EMAILS.includes(email)
  const { data: family, error } = await supabase
    .from('families')
    .select(`
      id,
      email,
      contact_email,
      address,
      dad_name,
      dad_phone,
      mom_name,
      mom_phone,
      family_players(
        player_id,
        players(
          id,
          first_name,
          last_name,
          jersey_number,
          bats,
          throws,
          catches,
          sort_order,
          status,
          player_private_details(
            birthdate,
            allergies
          )
        )
      )
    `)
    .or(`email.eq.${email},contact_email.eq.${email}`)
    .maybeSingle()

  if (error) {
    return { user: null, error: error.message }
  }

  if (!family) {
    await supabase.auth.signOut()
    return { user: null, error: 'Email address not found on the team roster.' }
  }

  const familyPlayers = (family.family_players ?? [])
    .map((link) => link.players)
    .filter(Boolean)
    .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100))
    .map((player) => parseFamilyPlayer(player, family.id))

  if (familyPlayers.length === 0) {
    await supabase.auth.signOut()
    return { user: null, error: 'No player is connected to this family account.' }
  }

  return {
    user: {
      email: family.email,
      contactEmail: family.contact_email,
      address: family.address,
      dadName: family.dad_name,
      dadPhone: family.dad_phone,
      momName: family.mom_name,
      momPhone: family.mom_phone,
      familyId: family.id,
      isAdmin: isAdminEmail,
      familyPlayers,
      players: familyPlayers.map((player) => player.name),
      activePlayer: familyPlayers[0],
    },
    error: null,
  }
}

function isFamilyField(field) {
  return ['dadName', 'dadPhone', 'momName', 'momPhone', 'parentEmail', 'address'].includes(field)
}

function isPlayerField(field) {
  return ['name', 'number', 'bats', 'throws', 'catches', 'birthdate', 'allergies', 'status'].includes(field)
}

function parseName(fullName) {
  const [first, ...rest] = fullName.trim().split(' ')
  return {
    first_name: first ?? '',
    last_name: rest.join(' ') || '',
  }
}

async function persistRosterField({ player, field, value, currentUser }) {
  const isAdmin = currentUser?.isAdmin
  const familyId = player.familyId ?? currentUser?.familyId

  if (field === 'password') {
    if (familyId !== currentUser?.familyId) {
      throw new Error('Cannot update password for another family from the client.')
    }

    const { error } = await supabase.auth.updateUser({ password: value })
    if (error) throw error
    return
  }

  if (isFamilyField(field)) {
    if (!familyId) {
      throw new Error('Missing family for roster update.')
    }
    const payload = {}
    if (field === 'dadName') payload.dad_name = value || null
    if (field === 'dadPhone') payload.dad_phone = value || null
    if (field === 'momName') payload.mom_name = value || null
    if (field === 'momPhone') payload.mom_phone = value || null
    if (field === 'address') payload.address = value || null
    if (field === 'parentEmail') {
      payload.contact_email = value || null
      if (familyId === currentUser?.familyId) {
        payload.email = value || null
      }
    }

    const { error } = await supabase.from('families').update(payload).eq('id', familyId)
    if (error) throw error
    return
  }

  if (isPlayerField(field)) {
    if (!player?.id) {
      throw new Error('Missing player id for roster update.')
    }

    const playerPayload = {}
    const privatePayload = {}

    if (field === 'name') {
      Object.assign(playerPayload, parseName(value))
    }
    if (field === 'number') {
      playerPayload.jersey_number = value ? Number(value) : null
    }
    if (field === 'bats') playerPayload.bats = value || null
    if (field === 'throws') playerPayload.throws = value || null
    if (field === 'catches') {
      if (value === 'Yes') playerPayload.catches = true
      else if (value === 'No') playerPayload.catches = false
      else playerPayload.catches = null
    }
    if (field === 'status') playerPayload.status = value || null
    if (field === 'birthdate') privatePayload.birthdate = value || null
    if (field === 'allergies') privatePayload.allergies = value || null

    if (Object.keys(playerPayload).length > 0) {
      const { error } = await supabase.from('players').update(playerPayload).eq('id', player.id)
      if (error) throw error
    }

    if (Object.keys(privatePayload).length > 0) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('player_private_details')
        .update(privatePayload)
        .eq('player_id', player.id)
        .select()

      if (updateError) throw updateError

      if ((updatedRows ?? []).length === 0) {
        if (isAdmin) {
          const { error: insertError } = await supabase
            .from('player_private_details')
            .insert({ player_id: player.id, ...privatePayload })
          if (insertError) throw insertError
        } else {
          throw new Error('Unable to save player private details. Contact an admin if the player record needs setup.')
        }
      }
    }

    return
  }

  throw new Error(`Unhandled roster field: ${field}`)
}

async function updateFamilyField(field, value) {
  try {
    await persistRosterField({ player: null, field, value, currentUser })
    setCurrentUser((user) => ({
      ...user,
      contactEmail: field === 'parentEmail' ? value : user.contactEmail,
      address: field === 'address' ? value : user.address,
      dadName: field === 'dadName' ? value : user.dadName,
      dadPhone: field === 'dadPhone' ? value : user.dadPhone,
      momName: field === 'momName' ? value : user.momName,
      momPhone: field === 'momPhone' ? value : user.momPhone,
    }))
  } catch (error) {
    console.error('Family update failed', error)
    setRosterError(error?.message || 'Unable to update family information.')
  }
}

function FamilyEditPanel({ editingFamily, fields, modeLabel, onClose, onUpdate }) {
  return (
    <ModalShell className="edit-panel family-info-modal" ariaLabel={`Edit ${editingFamily.email}`}>
      <div className="edit-panel-header">
        <div>
          <p>{modeLabel}</p>
          <h3>{editingFamily.email}</h3>
        </div>
        <button className="icon-close-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="roster-field-grid edit-field-grid">
        {fields.map(([field, label]) => (
          <label className={['address'].includes(field) ? 'roster-field is-wide' : 'roster-field'} key={`${editingFamily.familyId}-${field}`}>
            <span>{label}</span>
            <input
              type={field === 'parentEmail' ? 'email' : field === 'password' ? 'password' : 'text'}
              value={editingFamily[field] ?? ''}
              onChange={(event) => onUpdate(field, event.target.value)}
            />
          </label>
        ))}
      </div>

      <button className="primary-button" type="button" onClick={onClose}>
        Save
      </button>
    </ModalShell>
  )
}

function LoginScreen({ initialError = '', onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState(initialError)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured.')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setError(error.message || 'Unable to sign in.')
      return
    }

    const profileError = await onLogin(data.session)

    if (profileError) {
      setError(profileError)
    }
  }

  return (
    <main className="login-screen">
      <img className="login-corner-logo" src="/assets/scv-crushers-navy-logo.png" alt="SCV Crushers Navy logo" />
      <section className="login-card card">
        <div>
          <h1>SCV Crushers Navy Team Hub</h1>
          <p className="login-subtitle">Sign in with the parent email listed on the team roster.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <div className="password-input-wrap">
              <input
                autoComplete="current-password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((current) => !current)}
              >
                {isPasswordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="primary-button" type="submit">Sign In</button>
        </form>
      </section>
    </main>
  )
}

function AvailabilityPage({ currentUser, headerAction }) {
  const [selectedResponseWeekendId, setSelectedResponseWeekendId] = useState(null)
  const [weekends, setWeekends] = useState([])
  const [weekendResponses, setWeekendResponses] = useState({})
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true)
  const [availabilityError, setAvailabilityError] = useState('')
  const [savingWeekendId, setSavingWeekendId] = useState(null)
  const currentFamilyId = currentUser.familyId
  const activeFamilyPlayer = currentUser.familyPlayers?.find((player) => (
    player.id === currentUser.activePlayer.id
    || player.supabaseId === currentUser.activePlayer.supabaseId
    || player.name === currentUser.activePlayer.name
  ))
  const currentPlayerId = activeFamilyPlayer?.supabaseId ?? currentUser.activePlayer.supabaseId
  const monthTabs = useMemo(() => getMonthTabs(weekends), [weekends])
  const [activeMonth, setActiveMonth] = useState('')
  const visibleWeekends = useMemo(
    () => weekends.filter((weekend) => weekend.month === activeMonth),
    [activeMonth, weekends],
  )
  const selectedResponseWeekend = weekends.find((weekend) => weekend.id === selectedResponseWeekendId)
  const selectedResponseGroups = selectedResponseWeekend
    ? Object.entries(groupResponses(weekendResponses[selectedResponseWeekend.id] ?? [])).filter(([, group]) => group.length > 0)
    : []

  useEffect(() => {
    let isMounted = true

    async function loadAvailability() {
      if (!isSupabaseConfigured) {
        setIsLoadingAvailability(false)
        setAvailabilityError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.')
        return
      }

      setIsLoadingAvailability(true)
      setAvailabilityError('')

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        console.log('[Availability reload] auth email', authData.user?.email ?? currentUser.email)
        console.log('[Availability reload] current family id', currentFamilyId)
        console.log('[Availability reload] current player id', currentPlayerId)

        if (authError) {
          console.warn('[Availability reload] auth user lookup error', authError)
        }

        const [
          weekendsResult,
          playersResult,
          responsesResult,
        ] = await Promise.all([
          supabase
            .from('availability_weekends')
            .select('id, weekend_start, weekend_end, month_label, season_year')
            .eq('is_active', true)
            .order('weekend_start', { ascending: true }),
          supabase
            .from('players')
            .select('id, first_name, last_name, sort_order, status')
            .eq('status', 'active')
            .order('sort_order', { ascending: true }),
          supabase
            .from('availability_responses')
            .select('id, weekend_id, player_id, response'),
        ])

        console.log('[Availability reload] weekends result/error', weekendsResult.data, weekendsResult.error)
        console.log('[Availability reload] players result/error', playersResult.data, playersResult.error)
        console.log('[Availability reload] responses result/error', responsesResult.data, responsesResult.error)

        if (weekendsResult.error) throw weekendsResult.error
        if (playersResult.error) throw playersResult.error
        if (responsesResult.error) throw responsesResult.error

        const databasePlayers = playersResult.data ?? []
        const databaseWeekends = (weekendsResult.data ?? []).map((weekend) => ({
          id: weekend.id,
          dateRange: formatWeekendRangeFromDatabase(weekend.weekend_start, weekend.weekend_end),
          month: weekend.month_label,
          startDate: parseDatabaseDate(weekend.weekend_start),
        }))
        const responseLookup = new Map(
          (responsesResult.data ?? []).map((response) => [
            `${response.weekend_id}:${response.player_id}`,
            response,
          ]),
        )
        const responsesByWeekend = Object.fromEntries(
          databaseWeekends.map((weekend) => [
            weekend.id,
            databasePlayers.map((player) => {
              const savedResponse = responseLookup.get(`${weekend.id}:${player.id}`)

              return {
                id: savedResponse?.id,
                playerId: player.id,
                player: getPlayerName(player),
                status: DB_TO_APP_RESPONSE[savedResponse?.response] ?? 'Yes',
              }
            }),
          ]),
        )

        if (!isMounted) return

        setWeekends(databaseWeekends)
        setWeekendResponses(responsesByWeekend)
        setActiveMonth((currentMonth) => {
          const availableMonths = getMonthTabs(databaseWeekends)
          return availableMonths.includes(currentMonth) ? currentMonth : getDefaultWeekendMonth(databaseWeekends)
        })
      } catch (error) {
        if (!isMounted) return
        setAvailabilityError(error.message || 'Unable to load availability from Supabase.')
      } finally {
        if (isMounted) {
          setIsLoadingAvailability(false)
        }
      }
    }

    loadAvailability()

    return () => {
      isMounted = false
    }
  }, [currentFamilyId, currentPlayerId, currentUser.email])

  async function setPlayerResponse(weekendId, status) {
    console.log('[Availability save] auth email', currentUser.email)
    console.log('[Availability save] current family id', currentFamilyId)
    console.log('[Availability save] current player id', currentPlayerId)
    console.log('[Availability save] weekend id', weekendId)
    console.log('[Availability save] response value', APP_TO_DB_RESPONSE[status])

    if (!currentPlayerId) {
      setAvailabilityError('Unable to find the logged-in player in Supabase.')
      console.error('[Availability save] missing current player id')
      return
    }

    const previousResponses = weekendResponses[weekendId] ?? []

    setWeekendResponses((current) => ({
      ...current,
      [weekendId]: current[weekendId].map((response) => (
        response.playerId === currentPlayerId ? { ...response, status } : response
      )),
    }))

    setSavingWeekendId(weekendId)
    setAvailabilityError('')

    const { data, error } = await supabase
      .from('availability_responses')
      .upsert(
        {
          weekend_id: weekendId,
          player_id: currentPlayerId,
          response: APP_TO_DB_RESPONSE[status],
          submitted_by_family_id: currentFamilyId,
        },
        { onConflict: 'weekend_id,player_id' },
      )
      .select('id, weekend_id, player_id, response')
      .single()

    console.log('[Availability save] Supabase save result/error', data, error)

    if (error) {
      setWeekendResponses((current) => ({
        ...current,
        [weekendId]: previousResponses,
      }))
      setAvailabilityError(error.message || 'Unable to save availability response.')
    } else {
      const { data: verifiedResponse, error: verifyError } = await supabase
        .from('availability_responses')
        .select('id, weekend_id, player_id, response')
        .eq('weekend_id', weekendId)
        .eq('player_id', currentPlayerId)
        .single()

      console.log('[Availability save] Supabase verify result/error', verifiedResponse, verifyError)

      if (verifyError) {
        setAvailabilityError(verifyError.message || 'Availability saved, but reload verification failed.')
      }

      const savedStatus = DB_TO_APP_RESPONSE[verifiedResponse?.response ?? data.response] ?? status

      setWeekendResponses((current) => ({
        ...current,
        [weekendId]: current[weekendId].map((response) => (
          response.playerId === currentPlayerId
            ? { ...response, id: verifiedResponse?.id ?? data.id, status: savedStatus }
            : response
        )),
      }))
    }

    setSavingWeekendId(null)
  }

  return (
    <div className="page">
      <PageHeader
        action={headerAction}
        title="Tournament Planning"
        description="Mark your player's availability for each weekend so we can build the tournament schedule."
      />

      <div className="month-tabs" role="tablist" aria-label="Weekend month filter">
        {monthTabs.map((month) => (
          <button
            className={activeMonth === month ? 'month-tab is-active' : 'month-tab'}
            key={month}
            type="button"
            role="tab"
            aria-selected={activeMonth === month}
            onClick={() => setActiveMonth(month)}
          >
            {month}
          </button>
        ))}
      </div>

      {isLoadingAvailability && <p className="availability-message card">Loading availability...</p>}
      {availabilityError && <p className="availability-message availability-error card">{availabilityError}</p>}

      <section className="tournament-list">
        {!isLoadingAvailability && visibleWeekends.map((weekend) => {
          const responses = weekendResponses[weekend.id] ?? []
          const counts = getResponseCounts(responses)
          const totalResponses = responses.length
          const fullCount = counts.Yes
          const satCount = counts['Sat Only']
          const sunCount = counts['Sun Only']
          const noCount = counts.No
          const currentResponse = responses.find((response) => response.playerId === currentPlayerId)?.status ?? 'Yes'
          const isSaving = savingWeekendId === weekend.id

          return (
            <article className="card tournament-card" key={weekend.id}>
              <div className="availability-card-main">
                <div className="availability-card-left">
                  <h3 className="weekend-range">
                    <Icon name="calendar" size={17} />
                    {weekend.dateRange}
                  </h3>

                  <div className="availability-actions" aria-label={`${weekend.dateRange} response actions`}>
                    <button
                      className={currentResponse === 'Yes' ? 'yes-button is-selected' : 'yes-button'}
                      type="button"
                      aria-pressed={currentResponse === 'Yes'}
                      disabled={isSaving}
                      onClick={() => setPlayerResponse(weekend.id, 'Yes')}
                    >
                      {currentResponse === 'Yes' && <Icon name="check" size={13} />}
                      Yes
                    </button>
                    <button
                      className={currentResponse === 'No' ? 'no-button is-selected' : 'no-button'}
                      type="button"
                      aria-pressed={currentResponse === 'No'}
                      disabled={isSaving}
                      onClick={() => setPlayerResponse(weekend.id, 'No')}
                    >
                      {currentResponse === 'No' && <Icon name="x" size={13} />}
                      No
                    </button>
                    <button
                      className={currentResponse === 'Sat Only' ? 'partial-button is-selected' : 'partial-button'}
                      type="button"
                      aria-pressed={currentResponse === 'Sat Only'}
                      disabled={isSaving}
                      onClick={() => setPlayerResponse(weekend.id, 'Sat Only')}
                    >
                      {getResponseLabel('Sat Only')}
                    </button>
                    <button
                      className={currentResponse === 'Sun Only' ? 'partial-button is-selected' : 'partial-button'}
                      type="button"
                      aria-pressed={currentResponse === 'Sun Only'}
                      disabled={isSaving}
                      onClick={() => setPlayerResponse(weekend.id, 'Sun Only')}
                    >
                      {getResponseLabel('Sun Only')}
                    </button>
                  </div>
                </div>

                <div className="availability-card-right">
                  <div className="full-count">
                    <strong>{fullCount} / {totalResponses}</strong>
                    <span>Full</span>
                  </div>

                  <div className="response-summary" aria-label={`${weekend.dateRange} response summary`}>
                    <span>{fullCount} Full</span>
                    <span>{satCount} Sat</span>
                    <span>{sunCount} Sun</span>
                    <span>{noCount} No</span>
                  </div>

                  <button
                    className="toggle-responses-button"
                    type="button"
                    onClick={() => setSelectedResponseWeekendId(weekend.id)}
                  >
                    Show Responses
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {selectedResponseWeekend && (
        <ModalShell className="participants-modal card" ariaLabel={`${selectedResponseWeekend.dateRange} Responses`}>
          <div className="edit-panel-header">
            <div>
              <p>{selectedResponseWeekend.dateRange}</p>
              <h3>Responses</h3>
            </div>
            <button className="icon-close-button" type="button" onClick={() => setSelectedResponseWeekendId(null)}>
              Close
            </button>
          </div>
          <div className="response-groups modal-response-groups">
            {selectedResponseGroups.map(([status, responses]) => (
              <section className="response-group" key={`${selectedResponseWeekend.id}-${status}`}>
                <h4>{getResponseLabel(status)}</h4>
                <div className="response-list">
                  {responses.map((response) => (
                    <div className="response-row" key={`${selectedResponseWeekend.id}-${response.player}`}>
                      <span>{response.player}</span>
                      <strong className={`status ${getStatusClass(response.status)}`}>
                        {getResponseLabel(response.status)}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  )
}

function RosterPage({ currentUser, headerAction, rosterPlayers, coaches, updateRosterPlayer, onAddPlayer, onRemovePlayer }) {
  const [isCoachMode, setIsCoachMode] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const isAdminUser = Boolean(currentUser?.isAdmin)

  useEffect(() => {
    if (!isAdminUser && isCoachMode) {
      setIsCoachMode(false)
    }
  }, [isAdminUser, isCoachMode])

  const coachFields = [
    ['status', 'Status'],
    ['name', 'Player name'],
    ['number', 'Jersey number'],
    ['bats', 'Bats'],
    ['throws', 'Throws'],
    ['catches', 'Catches'],
    ['birthdate', 'Birthdate'],
    ['dadName', 'Dad name'],
    ['dadPhone', 'Dad phone'],
    ['momName', 'Mom name'],
    ['momPhone', 'Mom phone'],
    ['parentEmail', 'Parent email'],
    ['password', 'Password'],
    ['allergies', 'Player allergies'],
    ['address', 'Address'],
    ['id', 'Internal ID'],
  ]
  const visibleFields = isAdminUser && isCoachMode ? coachFields : familyEditFields
  const editingPlayer = rosterPlayers.find((player) => player.id === editingPlayerId)
  const canEditPlayer = (player) => player.familyId === currentUser.familyId

  function updatePlayer(playerId, field, value) {
    updateRosterPlayer(playerId, field, value)
  }

  return (
    <div className="page">
      <PageHeader
        action={headerAction}
        title="Roster"
        description="Keep your family's contact information and player details up to date."
      />

      <section className="roster-section">
        <h3>Coaches</h3>
        <div className="roster-table-card card">
          <div className="coach-contact-table">
            <div className="coach-contact-row roster-table-head">
              <span>Coach</span>
              <span>Phone</span>
              <span>Email</span>
            </div>
            {coaches.map((coach) => (
              <div className="coach-contact-row" key={coach.email}>
                <strong>{coach.name}</strong>
                <span>{coach.phone}</span>
                <span>{coach.email}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="roster-section">
        <div className="roster-section-heading">
          <h3>Players</h3>
          {isAdminUser ? (
            <button
              className={isCoachMode ? 'coach-toggle is-active' : 'coach-toggle'}
              type="button"
              aria-pressed={isCoachMode}
              onClick={() => setIsCoachMode((current) => !current)}
            >
              {isCoachMode ? 'Coach Mode On' : 'Parent View'}
            </button>
          ) : (
            <span className="coach-toggle coach-toggle-disabled">Parent View</span>
          )}
        </div>
        <section className="roster-table-card card">
        <div className={isCoachMode ? 'roster-table is-coach' : 'roster-table'}>
          <div className="roster-table-row roster-table-head">
            <span>Player</span>
            <span>#</span>
            <span>Bats</span>
            <span>Throws</span>
            <span>Catches</span>
            <span>Dad</span>
            <span>Mom</span>
            <span>Parent Email</span>
            {isAdminUser && isCoachMode && (
              <>
                <span>Birthdate</span>
                <span>Dad Contact</span>
                <span>Mom Contact</span>
                <span>Player Allergies</span>
                <span>Address</span>
              </>
            )}
            <span></span>
          </div>

          {rosterPlayers.map((player) => (
            <div className="roster-table-row" key={player.id}>
              <strong>{player.name}</strong>
              <span>{player.number}</span>
              <span>{player.bats || '—'}</span>
              <span>{player.throws || '—'}</span>
              <span>{player.catches || '—'}</span>
              <span>{player.dadName || '—'}</span>
              <span>{player.momName || '—'}</span>
              <span>{player.parentEmail || '—'}</span>
              {isAdminUser && isCoachMode && (
                <>
                  <span>{player.birthdate || '—'}</span>
                  <span>{player.dadPhone || '—'}</span>
                  <span>{player.momPhone || '—'}</span>
                  <span>{player.allergies || '—'}</span>
                  <span>{player.address || '—'}</span>
                </>
              )}
              {canEditPlayer(player) ? (
                <button className="table-edit-button" type="button" onClick={() => setEditingPlayerId(player.id)}>
                  Edit
                </button>
              ) : (
                <span></span>
              )}
            </div>
          ))}
        </div>
      </section>
      </section>

      {editingPlayer && (
        <RosterEditPanel
          editingPlayer={editingPlayer}
          fields={visibleFields}
          modeLabel={isCoachMode ? 'Coach Edit' : 'Parent Edit'}
          onClose={() => setEditingPlayerId(null)}
          onUpdate={updatePlayer}
        />
      )}
    </div>
  )
}

function RosterEditPanel({ editingPlayer, fields, modeLabel, onClose, onUpdate }) {
  return (
    <ModalShell className="edit-panel family-info-modal" ariaLabel={`Edit ${editingPlayer.name}`}>
      <div className="edit-panel-header">
        <div>
          <p>{modeLabel}</p>
          <h3>{editingPlayer.name}</h3>
        </div>
        <button className="icon-close-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="roster-field-grid edit-field-grid">
        {fields.map(([field, label]) => (
          <label className={['allergies', 'address'].includes(field) ? 'roster-field is-wide' : 'roster-field'} key={`${editingPlayer.id}-${field}`}>
            <span>{label}</span>
            <input
              type={field === 'birthdate' ? 'date' : field === 'parentEmail' ? 'email' : 'text'}
              value={editingPlayer[field] ?? ''}
              onChange={(event) => onUpdate(editingPlayer.id, field, event.target.value)}
            />
          </label>
        ))}
      </div>

      <button className="primary-button" type="button" onClick={onClose}>
        Save
      </button>
    </ModalShell>
  )
}

function ModalShell({ ariaLabel, children, className }) {
  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <aside className={`modal-container ${className}`} aria-label={ariaLabel}>
        {children}
      </aside>
    </div>,
    document.body,
  )
}

function OrderCenterPage({ currentUser, headerAction }) {
  const orderingPlayer = currentUser.players[0]
  const isAdminUser = Boolean(currentUser?.isAdmin)
  const [storeStatus, setStoreStatus] = useState('CLOSED')
  const [isCoachMode, setIsCoachMode] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [productForms, setProductForms] = useState(() => (
    Object.fromEntries(
      orderProducts.map((product) => [
        product.id,
        {
          quantity: 1,
          size: '',
        },
      ]),
    )
  ))
  const submittedOrders = [
    {
      player: 'Luke Belfi',
      items: 'Navy Practice Jersey, Navy FlexFit Hat',
      sizes: 'YM, SM-MD',
      quantities: '1, 1',
      total: 59,
    },
    {
      player: 'Josh Coe',
      items: 'Gray Practice Jersey',
      sizes: 'YL',
      quantities: '1',
      total: 34,
    },
  ]
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const isOrderingOpen = storeStatus === 'OPEN'
  const cartByPlayer = cartItems.reduce((groups, item) => {
    return {
      ...groups,
      [item.player]: [...(groups[item.player] ?? []), item],
    }
  }, {})

  function updateProductForm(productId, field, value) {
    setProductForms((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }))
  }

  function addProductToOrder(product) {
    if (!isOrderingOpen) {
      return
    }

    const form = productForms[product.id]

    setCartItems((currentItems) => [
      ...currentItems,
      {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        player: orderingPlayer,
        size: form.size || 'Size TBD',
        quantity: Number(form.quantity),
      },
    ])
    setIsSubmitted(false)
  }

  function removeCartItem(itemId) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  if (storeStatus === 'ORDERING COMPLETE') {
    return (
      <div className="page">
        <OrderCenterHeader headerAction={headerAction} />
        {isAdminUser && isCoachMode && (
          <CoachOrderControls
            storeStatus={storeStatus}
            setStoreStatus={setStoreStatus}
            showAllOrders={showAllOrders}
            setShowAllOrders={setShowAllOrders}
          />
        )}
        <section className="order-empty-state order-status-card card">
          <div>
            <h3>Ordering has closed.</h3>
            <strong>Thank you!</strong>
            <p>Coach is placing the team order.</p>
            <p>Expected delivery: <strong>{orderWindow.expectedDelivery}</strong></p>
          </div>
          {isAdminUser && (
            <OrderModeToggle isCoachMode={isCoachMode} setIsCoachMode={setIsCoachMode} />
          )}
        </section>
        {isAdminUser && isCoachMode && showAllOrders && <AllOrdersTable orders={submittedOrders} />}
      </div>
    )
  }

  return (
    <div className="page">
      <OrderCenterHeader headerAction={headerAction} />

      {isAdminUser && isCoachMode && (
        <CoachOrderControls
          storeStatus={storeStatus}
          setStoreStatus={setStoreStatus}
          showAllOrders={showAllOrders}
          setShowAllOrders={setShowAllOrders}
        />
      )}

      {isSubmitted && (
        <section className="order-submitted card">
          <h3>Order Submitted</h3>
          <p>Your order has been received.</p>
          <p>Coach will place one bulk order after the ordering deadline.</p>
          <p>Charges will appear on your next Team Expenses statement.</p>
        </section>
      )}

      {storeStatus === 'CLOSED' && (
        <section className="order-submitted order-status-card card">
          <div>
            <h3>The Order Center is currently closed.</h3>
            <p>The next ordering window has not been announced.</p>
          </div>
          {isAdminUser && (
            <OrderModeToggle isCoachMode={isCoachMode} setIsCoachMode={setIsCoachMode} />
          )}
        </section>
      )}

      {isOrderingOpen && (
        <section className="order-window-card card">
          <div>
            <h3>Order Window</h3>
            <strong>{orderWindow.startDate} – {orderWindow.endDate}</strong>
          </div>
          <div className="order-countdown">
            <span>Orders close in:</span>
            <strong>{orderWindow.closesIn}</strong>
          </div>
          {isAdminUser && (
            <OrderModeToggle isCoachMode={isCoachMode} setIsCoachMode={setIsCoachMode} />
          )}
        </section>
      )}

      <section className="order-center-layout">
        <div className="product-section">
          <div className="product-grid">
            {orderProducts.map((product) => (
              <ProductOrderCard
                form={productForms[product.id]}
                isOrderingOpen={isOrderingOpen}
                key={product.id}
                onAddToOrder={addProductToOrder}
                onUpdateForm={updateProductForm}
                product={product}
              />
            ))}
          </div>
        </div>

        <aside className="cart-panel card">
          <h3>Order Summary</h3>
          <p className="ordering-for">Ordering for: <strong>{orderingPlayer}</strong></p>
          {cartItems.length === 0 ? (
            <p>No items added yet.</p>
          ) : (
            <div className="cart-player-groups">
              {Object.entries(cartByPlayer).map(([player, items]) => (
                <div className="cart-player-group" key={player}>
                  <strong>{player}</strong>
                  {items.map((item) => (
                    <div className="cart-line-item" key={item.id}>
                      <div>
                        <span>{item.name}</span>
                        <small>{item.size} × {item.quantity}</small>
                      </div>
                      <strong>{formatCurrency(item.price * item.quantity)}</strong>
                      <button type="button" onClick={() => removeCartItem(item.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="cart-total-row">
            <span>Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={!isOrderingOpen || cartItems.length === 0}
            onClick={() => {
              setIsSubmitted(true)
              setCartItems([])
            }}
          >
            {isOrderingOpen ? 'Submit Order' : 'The store is currently closed'}
          </button>
        </aside>
      </section>

      {isAdminUser && isCoachMode && showAllOrders && <AllOrdersTable orders={submittedOrders} />}
    </div>
  )
}

function OrderCenterHeader({ headerAction }) {
  return (
    <PageHeader
      action={headerAction}
      title="Order Center"
      description="Bulk ordering only during specified windows. Orders are submitted to the coach."
    />
  )
}

function OrderModeToggle({ isCoachMode, setIsCoachMode }) {
  return (
    <button
      className={isCoachMode ? 'coach-toggle order-mode-toggle is-active' : 'coach-toggle order-mode-toggle'}
      type="button"
      aria-pressed={isCoachMode}
      onClick={() => setIsCoachMode((current) => !current)}
    >
      {isCoachMode ? 'Coach View' : 'Parent View'}
    </button>
  )
}

function CoachOrderControls({ storeStatus, setStoreStatus, showAllOrders, setShowAllOrders }) {
  return (
    <section className="coach-controls order-controls card">
      <div>
        <p>Coach Mode</p>
        <h3>Store Status: {storeStatus}</h3>
      </div>
      <button type="button" onClick={() => setStoreStatus('OPEN')}>Open Order Window</button>
      <button type="button" onClick={() => setStoreStatus('ORDERING COMPLETE')}>Close Order Window</button>
      <button type="button">Edit Deadline</button>
      <button type="button" onClick={() => setShowAllOrders((current) => !current)}>
        {showAllOrders ? 'Hide All Orders' : 'View All Orders'}
      </button>
      <button type="button" onClick={() => setStoreStatus('CLOSED')}>Set Closed</button>
    </section>
  )
}

function ProductOrderCard({ form, isOrderingOpen, onAddToOrder, onUpdateForm, product }) {
  const sizeOptions = product.type === 'hat'
    ? ['XS-SM', 'SM-MD', 'L-XL']
    : ['YS', 'YM', 'YL', 'YXL', 'AS', 'AM', 'AL', 'AXL']

  return (
    <article className="product-card card">
      <img src={product.image} alt="" />
      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <strong>{formatCurrency(product.price)}</strong>
        </div>
          <div className="product-card-controls">
          <label>
            Size
            <select
              value={form.size}
              onChange={(event) => onUpdateForm(product.id, 'size', event.target.value)}
            >
              <option value="">Select size</option>
              {sizeOptions.map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              min="1"
              type="number"
              value={form.quantity}
              onChange={(event) => onUpdateForm(product.id, 'quantity', event.target.value)}
            />
          </label>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={!isOrderingOpen}
          onClick={() => onAddToOrder(product)}
        >
          {isOrderingOpen ? 'Add to Order' : 'Ordering Closed'}
        </button>
      </div>
    </article>
  )
}

function AllOrdersTable({ orders }) {
  return (
    <section className="expense-section">
      <div className="section-heading-row">
        <h3>All Submitted Orders</h3>
        <button className="table-edit-button" type="button">Export CSV</button>
      </div>
      <div className="expense-table-card card">
        <div className="expense-table all-orders-table">
          <div className="expense-table-row expense-table-head">
            <span>Player</span>
            <span>Items</span>
            <span>Sizes</span>
            <span>Quantities</span>
            <span>Totals</span>
          </div>
          {orders.map((order) => (
            <div className="expense-table-row" key={`${order.player}-${order.items}`}>
              <strong>{order.player}</strong>
              <span>{order.items}</span>
              <span>{order.sizes}</span>
              <span>{order.quantities}</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function TeamExpensesPage({ currentUser, headerAction }) {
  const [activeMonth, setActiveMonth] = useState('May')
  const [selectedTournament, setSelectedTournament] = useState(null)
  const report = monthlyExpenseReports[activeMonth]
  const fixedSubtotal = report.fixedExpenses.at(-1)
  const fixedFamilyShare = fixedSubtotal.perFamilyMonthly
  const familyTournamentExpenses = report.tournaments.reduce((total, tournament) => {
    const familyParticipated = currentUser.players.some((player) => tournament.participatingPlayers.includes(player))
    return familyParticipated ? total + tournament.costPerParticipant : total
  }, 0)
  const familyMonthlyTotal = fixedFamilyShare + familyTournamentExpenses
  const transactionTotals = report.transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === 'Debit') {
        return { ...totals, moneyOut: totals.moneyOut + Math.abs(transaction.amount) }
      }

      if (transaction.type === 'Credit') {
        return { ...totals, moneyIn: totals.moneyIn + transaction.amount }
      }

      return totals
    },
    { moneyOut: 0, moneyIn: 0 },
  )

  return (
    <div className="page expenses-page">
      <PageHeader
        action={headerAction}
        title="Team Expenses"
        description="SCV Crushers Navy is a non-fee team. Monthly expenses reflect the team's actual operating costs and are divided equally among rostered players."
      />

      <div className="month-tabs expenses-month-tabs" role="tablist" aria-label="Expense month filter">
        {expenseMonths.map((month) => (
          <button
            className={activeMonth === month ? 'month-tab is-active' : 'month-tab'}
            key={month}
            type="button"
            role="tab"
            aria-selected={activeMonth === month}
            onClick={() => setActiveMonth(month)}
          >
            {month}
          </button>
        ))}
      </div>

      <section className="expense-section expenses-section">
        <div className="family-total-card card">
          <div className="family-total-main">
            <span>Family Monthly Total</span>
            <strong>{formatCurrency(familyMonthlyTotal)}</strong>
            <p>For {currentUser.players.join(', ')}</p>
          </div>
          <div className="family-payment-column">
            <span>Payment Status</span>
            <strong className="payment-status unpaid">🟡 UNPAID</strong>
          </div>
          <div className="family-total-breakdown">
            <div className="breakdown-line">
              <span>Fixed Share</span>
              <strong>{formatCurrency(fixedFamilyShare)}</strong>
            </div>
            <div className="breakdown-line">
              <span>Tournament Share</span>
              <strong>{formatCurrency(familyTournamentExpenses)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="expense-section expenses-section">
        <div className="section-heading-row expenses-section-heading">
          <h3>Fixed Monthly Expenses</h3>
        </div>
        <div className="expense-table-card card">
          <div className="expense-table expense-summary-table">
            <div className="expense-table-row expense-table-head">
              <span>Expense</span>
              <span>Per Session</span>
              <span>Sessions</span>
              <span>Total Team Cost</span>
              <span>Per Family / Mo.</span>
              <span>Notes</span>
            </div>
            {report.fixedExpenses.map((expense) => (
              <div
                className={expense.isTotal ? 'expense-table-row expense-total-row' : 'expense-table-row'}
                key={expense.expense}
              >
                <strong>{expense.expense}</strong>
                <span>{expense.perSession == null ? '—' : formatCurrency(expense.perSession)}</span>
                <span>{expense.sessions ?? '—'}</span>
                <span>{formatCurrency(expense.totalTeamCost)}</span>
                <span>{formatCurrency(expense.perFamilyMonthly)}</span>
                <span>{expense.notes}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="expense-section expenses-section">
        <div className="section-heading-row expenses-section-heading">
          <h3>Tournaments This Month</h3>
        </div>
        <div className="expense-table-card card">
          <div className="expense-table tournament-expense-table">
            <div className="expense-table-row expense-table-head">
              <span>Tournament Name</span>
              <span>Tournament Cost</span>
              <span>Number of Participants</span>
              <span>Cost Per Participant</span>
              <span>Participating Players</span>
            </div>
            {report.tournaments.map((tournament) => (
              <div className="expense-table-row" key={tournament.name}>
                <strong>{tournament.name}</strong>
                <span>{formatCurrency(tournament.tournamentCost)}</span>
                <span>{tournament.numberOfParticipants}</span>
                <span>{formatCurrency(tournament.costPerParticipant)}</span>
                <button
                  className="player-count-link"
                  type="button"
                  onClick={() => setSelectedTournament(tournament)}
                >
                  {tournament.numberOfParticipants} players
                </button>
              </div>
            ))}
            <div className="expense-table-row expense-total-row">
              <strong>Tournament Expenses Subtotal</strong>
              <span></span>
              <span></span>
              <span>{formatCurrency(familyTournamentExpenses)}</span>
              <span>Current family tournament share</span>
            </div>
          </div>
        </div>
      </section>

      <section className="expense-section expenses-section">
        <div className="section-heading-row expenses-section-heading">
          <h3>Bank Account Summary</h3>
        </div>
        <div className="expense-table-card card">
          <div className="expense-table bank-summary-table">
            <div className="expense-table-row expense-table-head">
              <span>Account Name</span>
              <span>Balance</span>
              <span>As Of</span>
              <span>Notes</span>
            </div>
            <div className="expense-table-row">
              <strong>{report.bankAccount.accountName}</strong>
              <span className="balance-paid">{formatCurrency(report.bankAccount.balance)}</span>
              <span>{report.bankAccount.asOf}</span>
              <span>{report.bankAccount.notes}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="expense-section expenses-section">
        <div className="section-heading-row expenses-section-heading">
          <h3>Monthly Transactions</h3>
        </div>
        <div className="expense-table-card card">
          <div className="expense-table transaction-table">
            <div className="expense-table-row expense-table-head">
              <span>Transaction</span>
              <span>Transaction Date</span>
              <span>Transaction Type</span>
              <span>Transaction Amount</span>
              <span>Balance</span>
              <span>Expense Note</span>
            </div>
            {report.transactions.map((transaction) => (
              <div className="expense-table-row" key={`${transaction.date}-${transaction.transaction}`}>
                <strong>{transaction.transaction}</strong>
                <span>{transaction.date}</span>
                <span>{transaction.type}</span>
                <span>{formatCurrency(transaction.amount)}</span>
                <span>{formatCurrency(transaction.balance)}</span>
                <span>{transaction.note}</span>
              </div>
            ))}
            <div className="expense-table-row transaction-summary-row money-out-row">
              <strong>Money Out</strong>
              <span></span>
              <span>Debit</span>
              <span>{formatCurrency(transactionTotals.moneyOut)}</span>
              <span></span>
              <span>Calculated from debit transactions</span>
            </div>
            <div className="expense-table-row transaction-summary-row money-in-row">
              <strong>Money In</strong>
              <span></span>
              <span>Credit</span>
              <span>{formatCurrency(transactionTotals.moneyIn)}</span>
              <span></span>
              <span>Calculated from credit transactions</span>
            </div>
          </div>
        </div>
      </section>

      {selectedTournament && (
        <ModalShell className="participants-modal card" ariaLabel="Participating Players">
          <div className="edit-panel-header">
            <div>
              <p>{selectedTournament.name}</p>
              <h3>Participating Players</h3>
            </div>
            <button className="icon-close-button" type="button" onClick={() => setSelectedTournament(null)}>
              Close
            </button>
          </div>
          <p className="participants-count">{selectedTournament.numberOfParticipants} players</p>
          <div className="participants-list">
            {selectedTournament.participatingPlayers.map((player) => (
              <span key={`${selectedTournament.name}-${player}`}>{player}</span>
            ))}
          </div>
        </ModalShell>
      )}
    </div>
  )
}

const pages = {
  availability: AvailabilityPage,
  expenses: TeamExpensesPage,
  roster: RosterPage,
  gear: OrderCenterPage,
}

function App() {
  const [activePage, setActivePage] = useState('availability')
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [rosterPlayers, setRosterPlayers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [isRosterLoading, setIsRosterLoading] = useState(true)
  const [rosterError, setRosterError] = useState('')
  const [activePlayerId, setActivePlayerId] = useState(null)
  const [isFamilyEditOpen, setIsFamilyEditOpen] = useState(false)
  const CurrentPage = useMemo(() => pages[activePage], [activePage])

  const applySession = useCallback(async (session) => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured.')
      setCurrentUser(null)
      setIsAuthLoading(false)
      return 'Supabase is not configured.'
    }

    const { user, error } = await loadSupabaseCurrentUser(session)

    if (error) {
      setAuthError(error)
      setCurrentUser(null)
      setActivePlayerId(null)
      setIsAuthLoading(false)
      return error
    }

    setAuthError('')
    setCurrentUser(user)
    setActivePlayerId((currentId) => (
      user.familyPlayers.some((player) => player.id === currentId)
        ? currentId
        : user.activePlayer.id
    ))
    setIsAuthLoading(false)
    return null
  }, [])

  useEffect(() => {
    let isMounted = true

    async function hydrateSession() {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setIsAuthLoading(false)
        }
        return
      }

      const { data } = await supabase.auth.getSession()

      if (!isMounted) return

      if (data.session) {
        await applySession(data.session)
      } else {
        setIsAuthLoading(false)
      }
    }

    hydrateSession()

    const { data: subscription } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (session) {
        applySession(session)
      } else {
        setCurrentUser(null)
        setActivePlayerId(null)
        setIsAuthLoading(false)
      }
    }) ?? { data: null }

    return () => {
      isMounted = false
      subscription?.subscription?.unsubscribe()
    }
  }, [applySession])

  useEffect(() => {
    let isMounted = true

    async function loadRosterData() {
      if (!currentUser) {
        return
      }

      setRosterError('')
      setIsRosterLoading(true)

      try {
        const [{ data: coachesData, error: coachesError }, { data: rosterData, error: rosterError }] = await Promise.all([
          supabase
            .from('coaches')
            .select('id,name,phone,email')
            .order('sort_order', { ascending: true }),
          currentUser.isAdmin
            ? supabase
                .from('players')
                .select(`
                  id,
                  first_name,
                  last_name,
                  jersey_number,
                  bats,
                  throws,
                  catches,
                  sort_order,
                  status,
                  player_private_details(
                    birthdate,
                    allergies
                  ),
                  family_players(
                    family_id,
                    families(
                      id,
                      dad_name,
                      dad_phone,
                      mom_name,
                      mom_phone,
                      contact_email,
                      address
                    )
                  )
                `)
                .order('sort_order', { ascending: true })
            : supabase
                .from('roster_directory')
                .select(`
                  player_id,
                  player_name,
                  first_name,
                  last_name,
                  jersey_number,
                  bats,
                  throws,
                  catches,
                  status,
                  family_id,
                  dad_name,
                  mom_name,
                  parent_email,
                  sort_order
                `)
                .order('sort_order', { ascending: true }),
        ])

        if (coachesError) throw coachesError
        if (rosterError) throw rosterError

        const parsedPlayers = currentUser.isAdmin
          ? (rosterData ?? []).map((player) => {
              const family = player.family_players?.[0]?.families
              return {
                id: player.id,
                supabaseId: player.id,
                familyId: player.family_players?.[0]?.family_id ?? null,
                first_name: player.first_name,
                last_name: player.last_name,
                name: getPlayerName(player),
                number: player.jersey_number ?? '',
                bats: player.bats ?? '',
                throws: player.throws ?? '',
                catches: player.catches == null ? '' : player.catches ? 'Yes' : '',
                status: player.status,
                birthdate: player.player_private_details?.birthdate ?? '',
                allergies: player.player_private_details?.allergies ?? '',
                dadName: family?.dad_name ?? '',
                dadPhone: family?.dad_phone ?? '',
                momName: family?.mom_name ?? '',
                momPhone: family?.mom_phone ?? '',
                parentEmail: family?.contact_email ?? '',
                address: family?.address ?? '',
              }
            })
          : (rosterData ?? []).map((player) => {
              const ownsPlayer = player.family_id === currentUser.familyId
              const ownPlayer = ownsPlayer
                ? currentUser.familyPlayers.find((p) => p.id === player.player_id)
                : null
              return {
                id: player.player_id,
                supabaseId: player.player_id,
                familyId: player.family_id ?? null,
                first_name: player.first_name,
                last_name: player.last_name,
                name: player.player_name,
                number: player.jersey_number ?? '',
                bats: player.bats ?? '',
                throws: player.throws ?? '',
                catches: player.catches == null ? '' : player.catches ? 'Yes' : '',
                status: player.status,
                birthdate: ownsPlayer ? ownPlayer?.birthdate ?? '' : '',
                allergies: ownsPlayer ? ownPlayer?.allergies ?? '' : '',
                dadName: player.dad_name ?? '',
                dadPhone: ownsPlayer ? currentUser.dadPhone ?? '' : '',
                momName: player.mom_name ?? '',
                momPhone: ownsPlayer ? currentUser.momPhone ?? '' : '',
                parentEmail: player.parent_email ?? '',
                address: ownsPlayer ? currentUser.address ?? '' : '',
              }
            })

        if (!isMounted) return
        setRosterPlayers(parsedPlayers)
        setCoaches(coachesData ?? [])
      } catch (error) {
        if (!isMounted) return
        setRosterError(error?.message || 'Unable to load roster from Supabase.')
      } finally {
        if (!isMounted) return
        setIsRosterLoading(false)
      }
    }

    loadRosterData()

    return () => {
      isMounted = false
    }
  }, [currentUser])

  if (isAuthLoading) {
    return (
      <main className="login-screen">
        <section className="login-card card">
          <div>
            <h1>SCV Crushers Navy Team Hub</h1>
            <p className="login-subtitle">Loading your team account...</p>
          </div>
        </section>
      </main>
    )
  }

  if (!currentUser) {
    return <LoginScreen onLogin={applySession} initialError={authError} />
  }

  const activePlayer = currentUser.familyPlayers.find((player) => player.id === activePlayerId) ?? currentUser.activePlayer
  const sampleRosterPlayer = rosterPlayers.find((player) => player.id === activePlayer.id)
  const activeRosterPlayer = {
    ...sampleRosterPlayer,
    ...activePlayer,
  }
  const resolvedCurrentUser = {
    ...currentUser,
    activePlayer: activeRosterPlayer,
    familyPlayers: currentUser.familyPlayers,
    players: [activeRosterPlayer.name],
    setActivePlayerId,
  }

  async function updateRosterPlayer(playerId, field, value) {
    setRosterPlayers((currentPlayers) => (
      currentPlayers.map((player) => (
        player.id === playerId ? { ...player, [field]: value } : player
      ))
    ))

    try {
      const player = rosterPlayers.find((candidate) => candidate.id === playerId)
      await persistRosterField({ player, field, value, currentUser })

      if (currentUser.activePlayer.id === playerId) {
        setCurrentUser((user) => ({
          ...user,
          players: field === 'name' ? [value] : user.players,
          familyPlayers: user.familyPlayers.map((player) => (
            player.id === playerId ? { ...player, [field]: value } : player
          )),
          activePlayer: {
            ...user.activePlayer,
            [field]: value,
          },
        }))
      }
    } catch (error) {
      console.error('Roster save failed', error)
      setRosterError(error?.message || 'Unable to save roster update.')
    }
  }

  const headerAction = (
    <AccountDropdown
      currentUser={resolvedCurrentUser}
      onEditFamily={() => setIsFamilyEditOpen(true)}
      onSignOut={() => {
        supabase?.auth.signOut()
        setCurrentUser(null)
        setActivePlayerId(null)
        setActivePage('availability')
      }}
    />
  )

  return (
    <AppShell
      activePage={activePage}
      setActivePage={setActivePage}
    >
      <CurrentPage
        currentUser={resolvedCurrentUser}
        headerAction={headerAction}
        rosterPlayers={rosterPlayers}
        coaches={coaches}
        updateRosterPlayer={updateRosterPlayer}
        onAddPlayer={async () => {
          const defaultName = 'New Player'
          const { data, error } = await supabase.from('players').insert({ first_name: 'New', last_name: 'Player', status: 'active' }).select('*').single()
          if (error) {
            setRosterError(error.message)
            return
          }
          setRosterPlayers((current) => ([...current, {
            id: data.id,
            supabaseId: data.id,
            familyId: null,
            first_name: data.first_name,
            last_name: data.last_name,
            name: getPlayerName(data),
            number: data.jersey_number ?? '',
            bats: data.bats ?? '',
            throws: data.throws ?? '',
            catches: data.catches == null ? '' : data.catches ? 'Yes' : '',
            status: data.status,
            birthdate: '',
            allergies: '',
            dadName: '',
            dadPhone: '',
            momName: '',
            momPhone: '',
            parentEmail: '',
            address: '',
          }]))
        }}
        onRemovePlayer={async (playerId) => {
          const { error } = await supabase.from('players').delete().eq('id', playerId)
          if (error) {
            setRosterError(error.message)
            return
          }
          setRosterPlayers((current) => current.filter((player) => player.id !== playerId))
        }}
      />
      {isFamilyEditOpen && (
        <FamilyEditPanel
          editingFamily={resolvedCurrentUser}
          fields={familyInfoFields}
          modeLabel="Family Information"
          onClose={() => setIsFamilyEditOpen(false)}
          onUpdate={updateFamilyField}
        />
      )}
    </AppShell>
  )
}

export default App
