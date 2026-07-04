import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './components/Icon'
import {
  expenseMonths,
  monthlyExpenseReports,
  navItems,
  orderProducts,
  orderWindow,
  players,
  weekendAvailability,
} from './data/teamData'
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
  const today = new Date()
  const upcomingWeekend = weekends
    .filter(({ startDate }) => startDate >= today)
    .sort((a, b) => a.startDate - b.startDate)[0]

  return upcomingWeekend?.month ?? weekends[0].month
}

function LoginScreen({ onLogin, rosterPlayers }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const matchedPlayers = rosterPlayers.filter((player) => (
      player.parentEmail.toLowerCase() === email.trim().toLowerCase()
    ))

    if (matchedPlayers.length === 0) {
      setError('Email address not found on the team roster.')
      return
    }

    if (password !== (matchedPlayers[0].password ?? 'Crushers')) {
      setError('Incorrect password.')
      return
    }

    onLogin({
      email: matchedPlayers[0].parentEmail,
      players: matchedPlayers.map((player) => player.name),
      activePlayer: matchedPlayers[0],
    })
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
  const currentPlayer = currentUser.activePlayer.name
  const [expandedWeekends, setExpandedWeekends] = useState({})
  const [weekendResponses, setWeekendResponses] = useState(() => (
    Object.fromEntries(
      weekendAvailability.map((weekend) => [weekend.id, weekend.responses]),
    )
  ))
  const monthTabs = useMemo(() => getMonthTabs(weekendAvailability), [])
  const [activeMonth, setActiveMonth] = useState(() => getDefaultWeekendMonth(weekendAvailability))
  const visibleWeekends = useMemo(
    () => weekendAvailability.filter((weekend) => weekend.month === activeMonth),
    [activeMonth],
  )

  function toggleWeekend(id) {
    setExpandedWeekends((current) => ({
      ...current,
      [id]: !current[id],
    }))
  }

  function setPlayerResponse(weekendId, status) {
    setWeekendResponses((current) => ({
      ...current,
      [weekendId]: current[weekendId].map((response) => (
        response.player === currentPlayer ? { ...response, status } : response
      )),
    }))
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

      <section className="tournament-list">
        {visibleWeekends.map((weekend) => {
          const responses = weekendResponses[weekend.id]
          const counts = getResponseCounts(responses)
          const groupedResponses = groupResponses(responses)
          const responseGroups = Object.entries(groupedResponses).filter(([, group]) => group.length > 0)
          const totalResponses = responses.length
          const fullCount = counts.Yes
          const satCount = counts['Sat Only']
          const sunCount = counts['Sun Only']
          const noCount = counts.No
          const isExpanded = Boolean(expandedWeekends[weekend.id])
          const currentResponse = responses.find((response) => response.player === currentPlayer)?.status ?? 'Yes'

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
                      onClick={() => setPlayerResponse(weekend.id, 'Yes')}
                    >
                      {currentResponse === 'Yes' && <Icon name="check" size={13} />}
                      Yes
                    </button>
                    <button
                      className={currentResponse === 'No' ? 'no-button is-selected' : 'no-button'}
                      type="button"
                      aria-pressed={currentResponse === 'No'}
                      onClick={() => setPlayerResponse(weekend.id, 'No')}
                    >
                      {currentResponse === 'No' && <Icon name="x" size={13} />}
                      No
                    </button>
                    <button
                      className={currentResponse === 'Sat Only' ? 'partial-button is-selected' : 'partial-button'}
                      type="button"
                      aria-pressed={currentResponse === 'Sat Only'}
                      onClick={() => setPlayerResponse(weekend.id, 'Sat Only')}
                    >
                      {getResponseLabel('Sat Only')}
                    </button>
                    <button
                      className={currentResponse === 'Sun Only' ? 'partial-button is-selected' : 'partial-button'}
                      type="button"
                      aria-pressed={currentResponse === 'Sun Only'}
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
                    aria-expanded={isExpanded}
                    onClick={() => toggleWeekend(weekend.id)}
                  >
                    {isExpanded ? 'Hide Responses' : 'Show Responses'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="response-groups">
                  {responseGroups.map(([status, responses]) => (
                    <section className="response-group" key={`${weekend.id}-${status}`}>
                      <h4>{getResponseLabel(status)}</h4>
                      <div className="response-list">
                        {responses.map((response) => (
                          <div className="response-row" key={`${weekend.id}-${response.player}`}>
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
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}

function RosterPage({ currentUser, headerAction, rosterPlayers, updateRosterPlayer }) {
  const [isCoachMode, setIsCoachMode] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const coaches = [
    { name: 'Devon Mascarenas', phone: '661-210-8943', email: 'dsddm3@gmail.com' },
    { name: 'Evan Belfi', phone: '818-427-9904', email: 'evanbelfi@gmail.com' },
  ]
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
  const visibleFields = isCoachMode ? coachFields : familyEditFields
  const editingPlayer = rosterPlayers.find((player) => player.id === editingPlayerId)
  const canEditPlayer = (player) => player.id === currentUser.activePlayer.id

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
          <button
            className={isCoachMode ? 'coach-toggle is-active' : 'coach-toggle'}
            type="button"
            aria-pressed={isCoachMode}
            onClick={() => setIsCoachMode((current) => !current)}
          >
            {isCoachMode ? 'Coach Mode On' : 'Parent View'}
          </button>
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
            {isCoachMode && (
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
              {isCoachMode && (
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
  const isAdminUser = ['evanbelfi@gmail.com', 'dsddm3@gmail.com'].includes(currentUser.email.toLowerCase())
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
  const [rosterPlayers, setRosterPlayers] = useState(players)
  const [isFamilyEditOpen, setIsFamilyEditOpen] = useState(false)
  const CurrentPage = useMemo(() => pages[activePage], [activePage])

  if (!currentUser) {
    return <LoginScreen rosterPlayers={rosterPlayers} onLogin={setCurrentUser} />
  }

  const activeRosterPlayer = rosterPlayers.find((player) => player.id === currentUser.activePlayer.id) ?? currentUser.activePlayer
  const resolvedCurrentUser = { ...currentUser, activePlayer: activeRosterPlayer, players: [activeRosterPlayer.name] }

  function updateRosterPlayer(playerId, field, value) {
    setRosterPlayers((currentPlayers) => (
      currentPlayers.map((player) => (
        player.id === playerId ? { ...player, [field]: value } : player
      ))
    ))

    if (currentUser.activePlayer.id === playerId) {
      setCurrentUser((user) => ({
        ...user,
        email: field === 'parentEmail' ? value : user.email,
        players: field === 'name' ? [value] : user.players,
        activePlayer: {
          ...user.activePlayer,
          [field]: value,
        },
      }))
    }
  }

  const headerAction = (
    <AccountDropdown
      currentUser={resolvedCurrentUser}
      onEditFamily={() => setIsFamilyEditOpen(true)}
      onSignOut={() => {
        setCurrentUser(null)
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
        updateRosterPlayer={updateRosterPlayer}
      />
      {isFamilyEditOpen && (
        <RosterEditPanel
          editingPlayer={activeRosterPlayer}
          fields={familyEditFields}
          modeLabel="Family Information"
          onClose={() => setIsFamilyEditOpen(false)}
          onUpdate={updateRosterPlayer}
        />
      )}
    </AppShell>
  )
}

export default App
