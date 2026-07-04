export const navItems = [
  { id: 'availability', label: 'Availability', icon: 'calendar' },
  { id: 'expenses', label: 'Expenses', icon: 'wallet' },
  { id: 'roster', label: 'Roster', icon: 'users' },
  { id: 'gear', label: 'Orders', icon: 'bag' },
]

const rosterFromSheet = [
  {
    name: 'Blake Thome',
    number: 84,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2014-09-09',
    dadName: 'Jake',
    dadPhone: '661-618-1590',
    momName: 'Nicole',
    momPhone: '(661) 236-8715',
    parentEmail: 'Nicole@thomewaterproofing',
    allergies: 'Allergic to Motrin',
  },
  {
    name: 'Brysen Moeller',
    number: 4,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2014-11-11',
    dadName: 'Chris',
    dadPhone: '818-261-8198',
    momName: 'Joanna',
    momPhone: '(818) 370-7458',
    parentEmail: 'Saar3233@msn.com',
    allergies: 'Anaphylactic NUTS/Asthma',
  },
  {
    name: 'Colten Willardsen',
    number: 44,
    bats: 'R',
    throws: 'R',
    catches: '',
    birthdate: '2014-08-16',
    dadName: 'Alex',
    dadPhone: '818-687-5635',
    momName: 'Maisie',
    momPhone: '(661) 557-4918',
    parentEmail: 'Ayywillard44@gmail.com',
    allergies: 'no allergies has asthma',
  },
  {
    name: 'Colt Voytish',
    number: 11,
    bats: 'R',
    throws: 'R',
    catches: '',
    birthdate: '2014-10-12',
    dadName: 'Kevin',
    dadPhone: '661-313-0865',
    momName: 'Candice',
    momPhone: '(310) 413-3606',
    parentEmail: 'Kvoytish48@gmail.com',
    allergies: 'None',
  },
  {
    name: 'Dash Mascarenas',
    number: 3,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2015-03-03',
    dadName: 'Devon',
    dadPhone: '661-210-8943',
    momName: 'Sasha',
    momPhone: '(661) 755-3220',
    parentEmail: 'Skmascarenas@gmail.com',
    allergies: '',
  },
  {
    name: 'Elijah Andreno',
    number: 12,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2015-06-05',
    dadName: 'Rob',
    dadPhone: '818-590-2903',
    momName: 'Teresa',
    momPhone: '(626) 215-3559',
    parentEmail: 'rb1701d@yahoo.com',
    allergies: 'None',
  },
  {
    name: 'Jameson Mandle',
    number: 52,
    bats: 'R',
    throws: 'R',
    catches: '',
    birthdate: '2014-10-20',
    dadName: 'Jason',
    dadPhone: '(661)310-5842',
    momName: 'Jen',
    momPhone: '(661)645-9928',
    parentEmail: '4jsracingteam@gmail.com',
    allergies: 'None',
  },
  {
    name: 'Jaxson Murphy',
    number: 5,
    bats: 'R',
    throws: 'R',
    catches: '',
    birthdate: '2014-12-20',
    dadName: '',
    dadPhone: '',
    momName: 'Melissa',
    momPhone: '661-317-2132',
    parentEmail: 'Melsspace26@gmail.com',
    allergies: 'None',
  },
  {
    name: 'John Leao',
    number: 6,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2014-09-04',
    dadName: 'Daniel',
    dadPhone: '661-904-8384',
    momName: 'Sophia',
    momPhone: '661-618-1140',
    parentEmail: 'Sophiacleao@gmail.com',
    allergies: 'None',
  },
  {
    name: 'Josh Coe',
    number: 2,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2014-11-24',
    dadName: 'Nate',
    dadPhone: '661-388-3510',
    momName: 'Teresa',
    momPhone: '(661) 305-7183',
    parentEmail: 'Tkubinak@yahoo.com',
    allergies: 'None/asthma',
  },
  {
    name: 'Luke Belfi',
    number: 7,
    bats: 'L',
    throws: 'R',
    catches: '',
    birthdate: '2014-10-24',
    dadName: 'Evan',
    dadPhone: '818-427-9904',
    momName: 'Kelly',
    momPhone: '(562) 301-8677',
    parentEmail: 'evanbelfi@gmail.com',
    allergies: '',
  },
  {
    name: 'Mylan Silva',
    number: 34,
    bats: 'R',
    throws: 'R',
    catches: '',
    birthdate: '2015-02-09',
    dadName: 'Bean',
    dadPhone: '818-747-3245',
    momName: 'Vanessa',
    momPhone: '(818) 747-5633',
    parentEmail: 'MylanSilva09@gmail.com',
    allergies: 'Amoxicillin/ Cats',
  },
  {
    name: 'Slater Terry',
    number: 20,
    bats: 'R',
    throws: 'R',
    catches: 'Yes',
    birthdate: '2014-10-20',
    dadName: 'Brad',
    dadPhone: '661-510-3969',
    momName: 'Alexis',
    momPhone: '(661) 609-3499',
    parentEmail: 'Alexisdterry@yahoo.com',
    allergies: 'None',
  },
]

export const players = rosterFromSheet.map((player) => ({
  id: `CR-${String(player.number).padStart(3, '0')}`,
  status: 'Active',
  address: '',
  password: 'Crushers',
  ...player,
}))

const availabilityPlayers = players.map((player) => player.name)

function getWeekendResponses() {
  return availabilityPlayers.map((player) => ({ player, status: 'Yes' }))
}

function formatWeekendRange(startDate, endDate) {
  const month = startDate.toLocaleString('en-US', { month: 'long' })
  return `${month} ${startDate.getDate()}–${endDate.getDate()}`
}

function buildWeekendAvailability(referenceDate) {
  const weekends = []
  const year = referenceDate.getFullYear()
  const firstDay = new Date(year, 8, 1)
  const lastDay = new Date(year, 11, 31)
  const cursor = new Date(firstDay)

  while (cursor.getDay() !== 6) {
    cursor.setDate(cursor.getDate() + 1)
  }

  while (cursor <= lastDay) {
    const startDate = new Date(cursor)
    const endDate = new Date(cursor)
    endDate.setDate(startDate.getDate() + 1)

    weekends.push({
      id: startDate.toISOString().slice(0, 10),
      dateRange: formatWeekendRange(startDate, endDate),
      month: startDate.toLocaleString('en-US', { month: 'long' }),
      startDate,
      responses: getWeekendResponses(weekends.length),
    })

    cursor.setDate(cursor.getDate() + 7)
  }

  return weekends
}

export const weekendAvailability = buildWeekendAvailability(new Date())

export const orderWindow = {
  title: 'Summer Practice Gear',
  startDate: 'June 15',
  endDate: 'June 22',
  closesIn: '4 Days',
  expectedDelivery: 'July 8',
}

export const orderProducts = [
  {
    id: 'navy-practice-jersey',
    name: 'Navy Practice Jersey',
    price: 34,
    type: 'jersey',
    image: '/assets/order-center/navy-practice-jersey.png',
    description: 'Navy lightweight practice jersey with Crushers team styling for summer workouts.',
  },
  {
    id: 'gray-practice-jersey',
    name: 'Gray Practice Jersey',
    price: 34,
    type: 'jersey',
    image: '/assets/order-center/gray-practice-jersey.png',
    description: 'Gray practice jersey for extra training days and cage sessions.',
  },
  {
    id: 'navy-flexfit-hat',
    name: 'Navy FlexFit Hat',
    price: 25,
    type: 'hat',
    image: '/assets/order-center/navy-flexfit-hat.png',
    description: 'Navy FlexFit team hat for practices, warmups, and tournament travel days.',
  },
  {
    id: 'gray-flexfit-hat',
    name: 'Gray FlexFit Hat',
    price: 25,
    type: 'hat',
    image: '/assets/order-center/gray-flexfit-hat.png',
    description: 'Gray FlexFit hat with clean Crushers branding.',
  },
]

export const expenseMonths = [
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function buildFixedExpenses(monthIndex) {
  const rows = [
    {
      expense: 'Cage / Field Rentals',
      perSession: 70 + monthIndex * 2,
      sessions: 6,
      notes: 'Monthly facility block',
    },
    {
      expense: 'Practice Field',
      perSession: 65,
      sessions: 4,
      notes: 'City field invoice',
    },
    {
      expense: 'Team Equipment Fund',
      perSession: 180,
      sessions: 1,
      notes: 'Baseballs, scorebooks, first aid',
    },
  ]
  const expenses = rows.map((row) => {
    const totalTeamCost = row.perSession * row.sessions

    return {
      ...row,
      totalTeamCost,
      perFamilyMonthly: Math.round(totalTeamCost / players.length),
    }
  })
  const totalTeamCost = expenses.reduce((total, expense) => total + expense.totalTeamCost, 0)

  return [
    ...expenses,
    {
      expense: 'Fixed Monthly Expenses Subtotal',
      perSession: null,
      sessions: null,
      totalTeamCost,
      perFamilyMonthly: Math.round(totalTeamCost / players.length),
      notes: 'Shared equally by rostered players',
      isTotal: true,
    },
  ]
}

function buildTournaments(monthIndex) {
  const primaryParticipants = [
    'Blake Thome',
    'Brysen Moeller',
    'Colten Willardsen',
    'Dash Mascarenas',
    'Elijah Andreno',
    'Jameson Mandle',
    'Jaxson Murphy',
    'John Leao',
    'Josh Coe',
    'Luke Belfi',
  ]
  const secondaryParticipants = [
    'Blake Thome',
    'Colt Voytish',
    'Dash Mascarenas',
    'Elijah Andreno',
    'John Leao',
    'Josh Coe',
    'Luke Belfi',
    'Mylan Silva',
    'Slater Terry',
  ]
  const rows = [
    {
      name: 'Perfect Game Tournament',
      tournamentCost: 895 + monthIndex * 35,
      participatingPlayers: primaryParticipants,
    },
    {
      name: 'Sunday Wood Bat Tournament',
      tournamentCost: 520 + monthIndex * 20,
      participatingPlayers: monthIndex % 2 === 0 ? secondaryParticipants : secondaryParticipants.slice(0, 8),
    },
  ]

  return rows.map((tournament) => ({
    ...tournament,
    numberOfParticipants: tournament.participatingPlayers.length,
    costPerParticipant: Math.round(tournament.tournamentCost / tournament.participatingPlayers.length),
  }))
}

function buildBankSummary(monthIndex) {
  return {
    accountName: 'SCV Crushers Navy Team Account',
    accountNumber: '**** 4821',
    routingNumber: '**** 1170',
    balance: 6840 + monthIndex * 410,
    asOf: `${expenseMonths[monthIndex]} 28, 2026`,
    notes: 'Reconciled against receipts and deposits',
  }
}

function buildTransactions(month, monthIndex, fixedExpenses, tournaments) {
  const cages = fixedExpenses[0]
  const practice = fixedExpenses[1]
  const fixedSubtotal = fixedExpenses.at(-1)
  const tournamentSubtotal = tournaments.reduce((total, tournament) => total + tournament.tournamentCost, 0)

  return [
    {
      transaction: 'Tournament Entries',
      date: `${month} 2`,
      type: 'Debit',
      amount: -tournamentSubtotal,
      balance: 6840 + monthIndex * 410 - tournamentSubtotal,
      note: 'Tournament fees paid',
    },
    {
      transaction: 'Family monthly deposits',
      date: `${month} 8`,
      type: 'Credit',
      amount: fixedSubtotal.totalTeamCost + tournamentSubtotal,
      balance: 6840 + monthIndex * 410,
      note: 'Monthly dues received',
    },
    {
      transaction: 'Cage / Field Rentals',
      date: `${month} 14`,
      type: 'Debit',
      amount: -cages.totalTeamCost,
      balance: 6840 + monthIndex * 410 - cages.totalTeamCost,
      note: cages.notes,
    },
    {
      transaction: 'Practice Field',
      date: `${month} 21`,
      type: 'Debit',
      amount: -practice.totalTeamCost,
      balance: 6840 + monthIndex * 410 - cages.totalTeamCost - practice.totalTeamCost,
      note: practice.notes,
    },
  ]
}

export const monthlyExpenseReports = Object.fromEntries(
  expenseMonths.map((month, monthIndex) => {
    const fixedExpenses = buildFixedExpenses(monthIndex)
    const tournaments = buildTournaments(monthIndex)

    return [
      month,
      {
        fixedExpenses,
        tournaments,
        bankAccount: buildBankSummary(monthIndex),
        transactions: buildTransactions(month, monthIndex, fixedExpenses, tournaments),
      },
    ]
  }),
)
