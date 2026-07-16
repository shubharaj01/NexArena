export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  stadium: string;
  ticketPrice: number;
  availableSeats: number;
  totalSeats: number;
  salesOpen: boolean;
}

export interface Seat {
  id: string; // e.g. "A-104-12-25" (Block-Section-Row-Seat)
  section: string;
  block: string;
  row: string;
  number: string;
  status: 'available' | 'reserved' | 'booked' | 'vip' | 'accessible';
  price: number;
}

export interface Booking {
  id: string;
  matchId: string;
  matchDetails: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    stadium: string;
  };
  userId: string;
  seats: string[];
  totalPrice: number;
  qrCode: string;
  gateNumber: string;
  bookingStatus: 'active' | 'past' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  bookingDate: string;
}

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  role: 'customer' | 'primary_admin' | 'secondary_admin';
  name: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

// Initial Data
const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    homeFlag: '🇦🇷',
    awayFlag: '🇫🇷',
    date: '2026-06-12',
    time: '18:00',
    stadium: 'MetLife Stadium (New York)',
    ticketPrice: 250,
    availableSeats: 480,
    totalSeats: 80000,
    salesOpen: true,
  },
  {
    id: 'm2',
    homeTeam: 'Brazil',
    awayTeam: 'Germany',
    homeFlag: '🇧🇷',
    awayFlag: '🇩🇪',
    date: '2026-06-15',
    time: '20:00',
    stadium: 'SoFi Stadium (Los Angeles)',
    ticketPrice: 280,
    availableSeats: 620,
    totalSeats: 75000,
    salesOpen: true,
  },
  {
    id: 'm3',
    homeTeam: 'USA',
    awayTeam: 'Mexico',
    homeFlag: '🇺🇸',
    awayFlag: '🇲🇽',
    date: '2026-06-18',
    time: '19:30',
    stadium: 'Azteca Stadium (Mexico City)',
    ticketPrice: 190,
    availableSeats: 310,
    totalSeats: 87000,
    salesOpen: true,
  },
  {
    id: 'm4',
    homeTeam: 'Japan',
    awayTeam: 'Spain',
    homeFlag: '🇯🇵',
    awayFlag: '🇪🇸',
    date: '2026-06-20',
    time: '17:00',
    stadium: 'BC Place (Vancouver)',
    ticketPrice: 220,
    availableSeats: 590,
    totalSeats: 54000,
    salesOpen: false,
  }
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'fan_user_882',
    username: 'fan1',
    password: 'fanpass',
    role: 'customer',
    name: 'Lionel Fan',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin_user_001',
    username: 'admin1',
    password: 'adminpass',
    role: 'primary_admin',
    name: 'Gianni Director',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin_user_002',
    username: 'admin2',
    password: 'secpass',
    role: 'secondary_admin',
    name: 'Sarah Chief',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];


// Helper to initialize database if empty
export const initMockDb = () => {
  if (!localStorage.getItem('ss_matches')) {
    localStorage.setItem('ss_matches', JSON.stringify(INITIAL_MATCHES));
  }
  
  const rawUsers = localStorage.getItem('ss_users');
  if (!rawUsers) {
    localStorage.setItem('ss_users', JSON.stringify(INITIAL_USERS));
  } else {
    try {
      const parsed = JSON.parse(rawUsers) as any[];
      const needsReinit = parsed.some(u => !u.username || !u.password);
      if (needsReinit) {
        localStorage.setItem('ss_users', JSON.stringify(INITIAL_USERS));
      }
    } catch (e) {
      localStorage.setItem('ss_users', JSON.stringify(INITIAL_USERS));
    }
  }

  if (!localStorage.getItem('ss_bookings')) {
    localStorage.setItem('ss_bookings', JSON.stringify([]));
  }
};


export const mockDb = {
  // Matches CRUD
  getMatches: (): Match[] => {
    initMockDb();
    return JSON.parse(localStorage.getItem('ss_matches') || '[]');
  },
  saveMatches: (matches: Match[]) => {
    localStorage.setItem('ss_matches', JSON.stringify(matches));
  },
  addMatch: (match: Omit<Match, 'id' | 'availableSeats'>) => {
    const matches = mockDb.getMatches();
    const newMatch: Match = {
      ...match,
      id: 'm' + (matches.length + 1),
      availableSeats: match.totalSeats ? Math.round(match.totalSeats * 0.05) : 500
    };
    matches.push(newMatch);
    mockDb.saveMatches(matches);
    return newMatch;
  },
  updateMatch: (updatedMatch: Match) => {
    const matches = mockDb.getMatches();
    const index = matches.findIndex(m => m.id === updatedMatch.id);
    if (index !== -1) {
      matches[index] = updatedMatch;
      mockDb.saveMatches(matches);
      return true;
    }
    return false;
  },
  deleteMatch: (id: string) => {
    const matches = mockDb.getMatches();
    const filtered = matches.filter(m => m.id !== id);
    mockDb.saveMatches(filtered);
  },

  // Users Auth & Suspend
  getUsers: (): UserProfile[] => {
    initMockDb();
    return JSON.parse(localStorage.getItem('ss_users') || '[]');
  },
  saveUsers: (users: UserProfile[]) => {
    localStorage.setItem('ss_users', JSON.stringify(users));
  },
  addUser: (username: string, name: string, role: 'customer' | 'primary_admin' | 'secondary_admin' = 'customer', password?: string): UserProfile => {
    const users = mockDb.getUsers();
    const newUser: UserProfile = {
      id: role.includes('admin') ? `admin_user_${Math.round(Math.random()*1000)}` : `fan_user_${Math.round(Math.random()*1000)}`,
      username,
      password: password || 'pass123',
      role,
      name,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    mockDb.saveUsers(users);
    return newUser;
  },
  deleteUser: (id: string) => {
    const users = mockDb.getUsers();
    const filtered = users.filter(u => u.id !== id);
    mockDb.saveUsers(filtered);
  },
  updateUserStatus: (id: string, status: 'active' | 'suspended') => {
    const users = mockDb.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].status = status;
      mockDb.saveUsers(users);
      return true;
    }
    return false;
  },

  // Bookings Log
  getBookings: (): Booking[] => {
    initMockDb();
    return JSON.parse(localStorage.getItem('ss_bookings') || '[]');
  },
  saveBookings: (bookings: Booking[]) => {
    localStorage.setItem('ss_bookings', JSON.stringify(bookings));
  },
  addBooking: (userId: string, matchId: string, seats: string[], totalPrice: number): Booking => {
    const bookings = mockDb.getBookings();
    const matches = mockDb.getMatches();
    const match = matches.find(m => m.id === matchId);
    
    // Gate mapping based on first seat's section
    let gate = 'Gate A';
    if (seats.length > 0) {
      const sec = seats[0].split('-')[1]; // e.g. "VIP-104-5-25" -> "104"
      if (sec === '106') gate = 'Gate B';
      if (sec === '110') gate = 'Gate C';
      if (sec === '220') gate = 'Gate D';
    }

    const newBooking: Booking = {
      id: 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      matchId,
      matchDetails: {
        homeTeam: match?.homeTeam || 'TBD',
        awayTeam: match?.awayTeam || 'TBD',
        date: match?.date || '',
        time: match?.time || '',
        stadium: match?.stadium || '',
      },
      userId,
      seats,
      totalPrice,
      qrCode: 'STAD-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      gateNumber: gate,
      bookingStatus: 'active',
      paymentStatus: 'paid',
      bookingDate: new Date().toISOString()
    };

    bookings.push(newBooking);
    mockDb.saveBookings(bookings);

    // Decrement seats remaining
    if (match) {
      match.availableSeats = Math.max(0, match.availableSeats - seats.length);
      mockDb.updateMatch(match);
    }

    return newBooking;
  },
  cancelBooking: (id: string): boolean => {
    const bookings = mockDb.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      const booking = bookings[index];
      booking.bookingStatus = 'cancelled';
      booking.paymentStatus = 'refunded';
      mockDb.saveBookings(bookings);

      // Increment seats remaining
      const matches = mockDb.getMatches();
      const match = matches.find(m => m.id === booking.matchId);
      if (match) {
        match.availableSeats += booking.seats.length;
        mockDb.updateMatch(match);
      }

      return true;
    }
    return false;
  },

  // Dynamic Seat Generation per Match
  getSeatsForMatch: (matchId: string): Seat[] => {
    const storageKey = `ss_seats_${matchId}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Generate fresh seats
    const sections = ['104', '106', '110', '220'];
    const rows = ['1', '2', '3', '4', '5'];
    const seats: Seat[] = [];
    const matches = mockDb.getMatches();
    const match = matches.find(m => m.id === matchId);
    const basePrice = match?.ticketPrice || 200;

    sections.forEach(sec => {
      rows.forEach(row => {
        for (let sNum = 1; sNum <= 10; sNum++) {
          const seatId = `${sec}-${row}-${sNum}`;
          
          // Determine class/accessibility
          let status: Seat['status'] = 'available';
          let price = basePrice;
          
          // VIP rows (row 1 is VIP)
          if (row === '1') {
            status = 'vip';
            price = basePrice * 1.8;
          } 
          // Accessible seats (last row, specific seat numbers)
          else if (row === '5' && (sNum === 9 || sNum === 10)) {
            status = 'accessible';
            price = basePrice * 0.9;
          }
          
          // Randomize some reserved and booked seats
          const rand = Math.random();
          if (status !== 'vip' && status !== 'accessible') {
            if (rand < 0.25) {
              status = 'booked';
            } else if (rand < 0.35) {
              status = 'reserved';
            }
          }

          seats.push({
            id: seatId,
            section: sec,
            block: sec.startsWith('1') ? 'A' : 'B',
            row,
            number: sNum.toString(),
            status,
            price
          });
        }
      });
    });

    localStorage.setItem(storageKey, JSON.stringify(seats));
    return seats;
  },
  saveSeatsForMatch: (matchId: string, seats: Seat[]) => {
    localStorage.setItem(`ss_seats_${matchId}`, JSON.stringify(seats));
  }
};
