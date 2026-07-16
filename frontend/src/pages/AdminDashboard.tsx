import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockDb, Match, Booking, UserProfile } from '../services/mockDb';
import { ssApi, AnnouncementItem } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
  Compass, Ticket, ClipboardList, Users, Megaphone, BarChart3, Settings,
  LogOut, Plus, Edit2, Trash2, ShieldAlert, Check, X, Search, DollarSign,
  UserCheck, ShieldCheck, RefreshCw, Download, Ban, Eye, Globe
} from 'lucide-react';


export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'bookings' | 'customers' | 'announcements' | 'analytics' | 'admins'>('overview');

  // Admin Management States
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminName.trim() || !adminPassword.trim()) return;
    try {
      mockDb.addUser(adminUsername, adminName, 'secondary_admin', adminPassword);
      setAdminName('');
      setAdminUsername('');
      setAdminPassword('');
      setAdmins(mockDb.getUsers().filter(u => u.role === 'primary_admin' || u.role === 'secondary_admin'));
    } catch (err: any) {
      alert(err.message || 'Failed to create secondary admin.');
    }
  };


  const handleDeleteAdmin = (id: string) => {
    if (id === user?.id) return;
    if (confirm('Are you sure you want to revoke this secondary admin\'s access credentials?')) {
      mockDb.deleteUser(id);
      setAdmins(mockDb.getUsers().filter(u => u.role === 'primary_admin' || u.role === 'secondary_admin'));
    }
  };

  // Database States
  const [matches, setMatches] = useState<Match[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);

  // Search filters
  const [matchSearch, setMatchSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Match Form modal
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formHomeTeam, setFormHomeTeam] = useState('');
  const [formAwayTeam, setFormAwayTeam] = useState('');
  const [formHomeFlag, setFormHomeFlag] = useState('🏳️');
  const [formAwayFlag, setFormAwayFlag] = useState('🏳️');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formStadium, setFormStadium] = useState('MetLife Stadium');
  const [formPrice, setFormPrice] = useState(200);
  const [formCapacity, setFormCapacity] = useState(70000);
  const [formSalesOpen, setFormSalesOpen] = useState(true);

  // Announcement Form State
  const [announceCategory, setAnnounceCategory] = useState<'congestion' | 'weather' | 'emergency' | 'info'>('congestion');
  const [announceDetails, setAnnounceDetails] = useState('');
  const [announceLoading, setAnnounceLoading] = useState(false);

  // Translate previews on announcements
  const [previewLanguage, setPreviewLanguage] = useState<Record<number, string>>({});
  const [previewTranslation, setPreviewTranslation] = useState<Record<number, string>>({});

  const loadData = async () => {
    setMatches(mockDb.getMatches());
    setBookings(mockDb.getBookings());
    setCustomers(mockDb.getUsers().filter(u => u.role === 'customer'));
    setAdmins(mockDb.getUsers().filter(u => u.role === 'primary_admin' || u.role === 'secondary_admin'));
    try {
      const history = await ssApi.getAnnouncements();
      setAnnouncements(history);
    } catch (e) {
      console.warn("Failed fetching safety announcement history:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Match CRUD Submit
  const handleMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMatch) {
      // Modify
      const updated: Match = {
        ...editingMatch,
        homeTeam: formHomeTeam,
        awayTeam: formAwayTeam,
        homeFlag: formHomeFlag,
        awayFlag: formAwayFlag,
        date: formDate,
        time: formTime,
        stadium: formStadium,
        ticketPrice: formPrice,
        totalSeats: formCapacity,
        salesOpen: formSalesOpen
      };
      mockDb.updateMatch(updated);
    } else {
      // Create new
      mockDb.addMatch({
        homeTeam: formHomeTeam,
        awayTeam: formAwayTeam,
        homeFlag: formHomeFlag,
        awayFlag: formAwayFlag,
        date: formDate,
        time: formTime,
        stadium: formStadium,
        ticketPrice: formPrice,
        totalSeats: formCapacity,
        salesOpen: formSalesOpen
      });
    }
    setMatchModalOpen(false);
    setEditingMatch(null);
    loadData();
  };

  // Open Edit Match Modal
  const handleEditMatchClick = (m: Match) => {
    setEditingMatch(m);
    setFormHomeTeam(m.homeTeam);
    setFormAwayTeam(m.awayTeam);
    setFormHomeFlag(m.homeFlag);
    setFormAwayFlag(m.awayFlag);
    setFormDate(m.date);
    setFormTime(m.time);
    setFormStadium(m.stadium);
    setFormPrice(m.ticketPrice);
    setFormCapacity(m.totalSeats);
    setFormSalesOpen(m.salesOpen);
    setMatchModalOpen(true);
  };

  // Delete Match
  const handleDeleteMatchClick = (id: string) => {
    if (confirm('Are you sure you want to delete this match record? This is non-reversible.')) {
      mockDb.deleteMatch(id);
      loadData();
    }
  };

  // Suspend Customer Account
  const handleToggleCustomerStatus = (id: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    mockDb.updateUserStatus(id, nextStatus);
    loadData();
  };

  // Cancel Booking Admin
  const handleAdminCancelBooking = (bookingId: string) => {
    if (confirm('Cancel this booking invoice and initiate mock refund?')) {
      mockDb.cancelBooking(bookingId);
      loadData();
    }
  };

  // Generate safety alert PA via API
  const handleGenerateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceDetails.trim()) return;
    setAnnounceLoading(true);
    try {
      await ssApi.generateAnnouncement(announceCategory, announceDetails);
      setAnnounceDetails('');
      loadData();
    } catch (err) {
      alert('FastAPI announcement generator service failed.');
    } finally {
      setAnnounceLoading(false);
    }
  };

  // Approve Announcement Alert
  const handleApproveAnnouncement = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await ssApi.approveAnnouncement(id, status);
      loadData();
    } catch (e) {
      alert('Failed updating approval authorization.');
    }
  };

  // Translate preview
  const handleTranslatePreview = async (announceId: number, targetLanguage: string) => {
    if (!targetLanguage) return;
    setPreviewLanguage(prev => ({ ...prev, [announceId]: targetLanguage }));
    setPreviewTranslation(prev => ({ ...prev, [announceId]: 'Translating...' }));
    try {
      const result = await ssApi.translateAnnouncement(announceId, targetLanguage);
      setPreviewTranslation(prev => ({ ...prev, [announceId]: result }));
    } catch (e) {
      setPreviewTranslation(prev => ({ ...prev, [announceId]: 'Preview translation error.' }));
    }
  };

  // KPI Calculations
  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalPrice, 0);
  const totalTicketsSold = bookings.filter(b => b.bookingStatus === 'active').reduce((sum, b) => sum + b.seats.length, 0);
  const remainingCapacity = matches.reduce((sum, m) => sum + m.availableSeats, 0);
  const activeMatchesCount = matches.length;
  const customersCount = customers.length;

  // Chart data simulation
  const revenueChartData = [
    { name: 'June 1', revenue: 15200 },
    { name: 'June 5', revenue: 24500 },
    { name: 'June 8', revenue: 38200 },
    { name: 'June 12', revenue: totalRevenue > 0 ? totalRevenue * 0.7 : 45000 },
    { name: 'June 15', revenue: totalRevenue > 0 ? totalRevenue : 75000 },
  ];

  const occupancyChartData = matches.map(m => ({
    name: `${m.homeTeam} vs ${m.awayTeam}`,
    sold: m.totalSeats - m.availableSeats,
    available: m.availableSeats,
  }));

  const hourlyBookingData = [
    { time: '08:00', bookings: 12 },
    { time: '10:00', bookings: 45 },
    { time: '12:00', bookings: 68 },
    { time: '14:00', bookings: 120 },
    { time: '16:00', bookings: 85 },
    { time: '18:00', bookings: 210 },
    { time: '20:00', bookings: 310 },
    { time: '22:00', bookings: 145 },
  ];

  return (
    <div className="flex w-full h-screen bg-surface font-sans text-on-surface overflow-hidden relative">
      {/* Admin Sidebar - matches layout of ticket_booking.html sidebar styling */}
      <aside className="w-64 flex-shrink-0 bg-inverse-surface border-r border-outline-variant flex flex-col justify-between py-6 px-4 z-50">
        <div>
          {/* Logo Section */}
          <div className="flex items-center space-x-3 mb-10 px-2">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-md">stadium</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">NexArena</h1>
              <span className="text-[10px] text-primary-fixed-dim uppercase tracking-widest font-medium">Stadium Management</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'KPI Dashboard', icon: 'dashboard' },
              { id: 'matches', label: 'Match Manager', icon: 'confirmation_number' },
              { id: 'bookings', label: 'Bookings Log', icon: 'sticky_note_2' },
              { id: 'customers', label: 'Customer Registry', icon: 'group' },
              { id: 'announcements', label: 'AI Announcements', icon: 'campaign' },
              { id: 'analytics', label: 'Charts & Heatmaps', icon: 'monitoring' },
              ...(user?.role === 'primary_admin' ? [{ id: 'admins', label: 'Admin Registry', icon: 'admin_panel_settings' }] : []),
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white active-nav-glow font-bold' : 'text-on-surface-variant/60 hover:text-white hover:bg-white/10'}`}
                >
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin profile & logout */}
        <div className="mt-auto">
          <div className="bg-surface-container-lowest rounded-2xl p-3 flex items-center justify-between shadow-sm border border-outline-variant/20">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold truncate text-on-surface leading-tight block">{user?.name || 'Administrator'}</span>
                <span className="text-[10px] text-on-surface-variant truncate block">@{user?.username || 'admin1'}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-md">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden relative">
        {/* HUD header */}
        <header className="h-16 border-b border-outline-variant flex items-center justify-between px-8 bg-surface/85 backdrop-blur-md z-40 flex-shrink-0">
          <h2 className="text-sm font-bold tracking-tight text-on-surface uppercase">
            World Cup System Administration Panel
          </h2>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            ALL SYSTEM NODES ONLINE
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-grow p-8 overflow-y-auto relative bg-background">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, label: "+14% sales this week", icon: DollarSign, color: 'text-emerald-600 bg-emerald-500/10' },
                  { title: 'Tickets Issued', value: totalTicketsSold, label: "Active seat allocations", icon: Ticket, color: 'text-primary bg-primary/10' },
                  { title: 'Remaining Available Seats', value: remainingCapacity.toLocaleString(), label: "Across 4 stadiums", icon: Compass, color: 'text-tertiary bg-tertiary/10' },
                  { title: 'Active Match Events', value: activeMatchesCount, label: "Live tournament roster", icon: ClipboardList, color: 'text-primary bg-primary/10' },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{kpi.title}</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{kpi.value}</div>
                        <span className="text-[10px] text-on-surface-variant mt-1 block">{kpi.label}</span>
                      </div>
                      <div className={`w-12 h-12 rounded-xl border border-outline-variant/30 flex items-center justify-center ${kpi.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Area and Bar Chart summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 h-80 flex flex-col shadow-sm">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Revenue Operations Yield</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6750a4" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6750a4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" stroke="#7a7582" fontSize={10} />
                        <YAxis stroke="#7a7582" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbc4d2', color: '#1d1b20' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#6750a4" fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Occupancy Chart */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 h-80 flex flex-col shadow-sm">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Arena Seat Allocation</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" stroke="#7a7582" fontSize={9} />
                        <YAxis stroke="#7a7582" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbc4d2', color: '#1d1b20' }} />
                        <Bar dataKey="sold" name="Reserved Seats" fill="#6750a4" stackId="a" />
                        <Bar dataKey="available" name="Available Seats" fill="#e6e0e9" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATCH MANAGER */}
          {activeTab === 'matches' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-extrabold">Match Ticket & Capacity Configurations</h2>
                  <p className="text-xs text-slate-400 mt-1">Draft match rosters, set seat prices, configure stadium venues, and toggle reservation gates.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingMatch(null);
                    setFormHomeTeam('');
                    setFormAwayTeam('');
                    setFormHomeFlag('🏳️');
                    setFormAwayFlag('🏳️');
                    setFormDate('');
                    setFormTime('');
                    setFormStadium('MetLife Stadium');
                    setFormPrice(200);
                    setFormCapacity(70000);
                    setFormSalesOpen(true);
                    setMatchModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-brand-purple to-brand-pink py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-glowPurple hover:scale-[1.01] transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Match Event
                </button>
              </div>

              {/* Match Table */}
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Match ID</th>
                      <th className="p-4">Roster Teams</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Stadium Venue</th>
                      <th className="p-4">Seat Pricing</th>
                      <th className="p-4">Capacity Status</th>
                      <th className="p-4">Sales Gate</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-200">
                    {matches.map(m => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 font-bold text-brand-purple">{m.id.toUpperCase()}</td>
                        <td className="p-4 font-bold flex items-center gap-2">
                          <span>{m.homeFlag}</span>
                          <span>{m.homeTeam} vs {m.awayTeam}</span>
                          <span>{m.awayFlag}</span>
                        </td>
                        <td className="p-4">{m.date} • {m.time}</td>
                        <td className="p-4 truncate max-w-[150px]">{m.stadium}</td>
                        <td className="p-4 font-bold text-brand-cyan">${m.ticketPrice}</td>
                        <td className="p-4">
                          <span className="font-semibold text-white">{m.availableSeats.toLocaleString()}</span>
                          <span className="text-slate-500"> / {m.totalSeats.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${m.salesOpen ? 'bg-emerald-500/20 text-brand-green' : 'bg-red-500/20 text-red-400'}`}>
                            {m.salesOpen ? 'Open' : 'Closed'}
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleEditMatchClick(m)}
                            className="p-2 border border-white/10 hover:border-brand-purple/30 rounded-lg hover:text-brand-pink transition"
                            title="Edit"
                            aria-label={`Edit match ${m.homeTeam} vs ${m.awayTeam}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMatchClick(m.id)}
                            className="p-2 border border-white/10 hover:border-brand-red/30 rounded-lg hover:text-red-400 transition"
                            title="Delete"
                            aria-label={`Delete match ${m.homeTeam} vs ${m.awayTeam}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BOOKINGS LOG */}
          {activeTab === 'bookings' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface">Match Ticket Purchase Logs</h2>
                <p className="text-xs text-on-surface-variant mt-1">Audit customer purchase transactions, authorize cancellations, process refunds, and export logs.</p>
              </div>

              {/* Search HUD */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
                <div className="flex-grow min-w-[200px] relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by Booking ID or User ID..."
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                </div>
                <button
                  onClick={() => alert('Exporting bookings spreadsheet log...')}
                  className="bg-surface-container-low border border-outline-variant hover:bg-surface-container-high text-xs font-bold px-4 py-2.5 rounded-xl text-on-surface transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-primary" /> Export CSV Report
                </button>
              </div>

              {/* Bookings table */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-4 overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-outline-variant text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                      <th className="p-4">Booking ID</th>
                      <th className="p-4">Customer ID</th>
                      <th className="p-4">Match Event</th>
                      <th className="p-4">Allocated Seats</th>
                      <th className="p-4">Total Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-on-surface">
                    {bookings
                      .filter(b => b.id.toLowerCase().includes(bookingSearch.toLowerCase()) || b.userId.toLowerCase().includes(bookingSearch.toLowerCase()))
                      .map(b => (
                        <tr key={b.id} className="border-b border-outline-variant hover:bg-surface-container transition">
                          <td className="p-4 font-bold text-primary">{b.id}</td>
                          <td className="p-4 text-on-surface-variant font-mono">{b.userId}</td>
                          <td className="p-4 font-semibold">{b.matchDetails.homeTeam} vs {b.matchDetails.awayTeam}</td>
                          <td className="p-4 text-primary font-bold">{b.seats.join(', ')}</td>
                          <td className="p-4 font-bold">${b.totalPrice}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${b.bookingStatus === 'active' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-error-container text-error'}`}>
                              {b.bookingStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${b.paymentStatus === 'paid' ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'}`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end">
                            {b.bookingStatus === 'active' && (
                              <button
                                onClick={() => handleAdminCancelBooking(b.id)}
                                className="px-3 py-1.5 bg-error-container border border-error/20 text-error rounded-lg hover:bg-error/10 text-[10px] font-bold transition flex items-center gap-1.5"
                              >
                                <Ban className="w-3.5 h-3.5" /> Cancel / Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface">Registered Customer Directory</h2>
                <p className="text-xs text-on-surface-variant mt-1">Audit customer credentials, change access status, and reset credentials.</p>
              </div>

              {/* Search HUD */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by customer email address or name..."
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* Customers table */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-4 overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-outline-variant text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                      <th className="p-4">Customer ID</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Username Credentials</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Registered Date</th>
                      <th className="p-4 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-on-surface">
                    {customers
                      .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.username.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map(c => (
                        <tr key={c.id} className="border-b border-outline-variant hover:bg-surface-container transition">
                          <td className="p-4 font-bold text-primary">{c.id}</td>
                          <td className="p-4 font-semibold">{c.name}</td>
                          <td className="p-4 text-on-surface-variant font-mono">{c.username}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-error-container text-error'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-on-surface-variant font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleCustomerStatus(c.id, c.status)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${c.status === 'active' ? 'bg-error-container border-error/20 text-error hover:bg-error/10' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 hover:bg-emerald-500/20'}`}
                            >
                              {c.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                            </button>
                            <button
                              onClick={() => alert(`Temporary reset key generated for ${c.username}`)}
                              className="px-3 py-1.5 border border-outline-variant hover:border-primary/45 rounded-lg text-[10px] font-semibold text-on-surface transition"
                            >
                              Reset Key
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AI ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn">
              
              {/* Creator Form */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant pb-3">Generate safety announcement</h3>
                <form onSubmit={handleGenerateAnnouncement} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-category-alert-type-1">Category Alert Type</label>
                    <select id="admindashboard-category-alert-type-1"
                      value={announceCategory}
                      onChange={(e) => setAnnounceCategory(e.target.value as any)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none cursor-pointer focus:border-primary"
                    >
                      <option value="congestion">Crowd Congestion</option>
                      <option value="weather">Weather Warning</option>
                      <option value="emergency">Emergency / Evacuation</option>
                      <option value="info">General Info</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-core-alert-details-2">Core Alert Details</label>
                    <textarea id="admindashboard-core-alert-details-2"
                      rows={5}
                      required
                      value={announceDetails}
                      onChange={(e) => setAnnounceDetails(e.target.value)}
                      placeholder="Specify gates affected, crowd guidelines, weather status..."
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={announceLoading}
                    className="w-full bg-primary text-on-primary py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {announceLoading ? 'Synthesizing with AI...' : 'Generate Alert'}
                  </button>
                </form>
              </div>

              {/* Announcements authorization queue */}
              <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant pb-3">PA Broadcasting Authorization Queue</h3>
                
                <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {announcements.length > 0 ? (
                    announcements.map((item) => {
                      let badge = 'bg-surface-container text-on-surface-variant border-outline-variant';
                      if (item.category === 'congestion') badge = 'bg-primary/10 text-primary border-primary/20';
                      if (item.category === 'emergency') badge = 'bg-error-container text-error border-error/20 animate-pulse';
                      if (item.category === 'weather') badge = 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/20';

                      return (
                        <div key={item.id} className="p-4 bg-surface-container-low/60 border border-outline-variant rounded-2xl flex flex-col gap-3">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-bold ${badge}`}>
                                {item.category}
                              </span>
                              <span className={`text-[9px] font-bold uppercase ${item.status === 'approved' ? 'text-emerald-700' : item.status === 'pending' ? 'text-tertiary' : 'text-error'}`}>
                                {item.status}
                              </span>
                            </div>
                            <span className="text-on-surface-variant text-[10px] font-mono">
                              {new Date(item.created_at).toLocaleDateString()} @ {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs text-on-surface leading-relaxed font-semibold">{item.original_text}</p>

                          {/* Preview translation */}
                          <div className="border-t border-outline-variant pt-3 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px]">
                              <Globe className="w-3.5 h-3.5 text-primary" />
                              <span className="text-on-surface-variant">Preview Translation:</span>
                              <select
                                onChange={(e) => handleTranslatePreview(item.id, e.target.value)}
                                className="bg-surface-container border border-outline-variant rounded-lg px-2 py-1 text-[10px] text-on-surface outline-none cursor-pointer"
                              >
                                <option value="">Select language...</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="Arabic">Arabic</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Portuguese">Portuguese</option>
                                <option value="German">German</option>
                                <option value="Japanese">Japanese</option>
                              </select>
                            </div>

                            {/* Approve/Reject Controls */}
                            {item.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveAnnouncement(item.id, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 rounded text-[10px] font-bold transition flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Authorize & Publish
                                </button>
                                <button
                                  onClick={() => handleApproveAnnouncement(item.id, 'rejected')}
                                  className="px-2.5 py-1 bg-error-container hover:bg-error/10 text-error border border-error/20 rounded text-[10px] font-bold transition flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Dismiss
                                </button>
                              </div>
                            )}
                          </div>

                          {previewTranslation[item.id] && (
                            <div className="mt-2 p-2.5 bg-primary/5 border border-primary/15 rounded-lg text-[10px] text-primary font-medium animate-fadeIn">
                              <strong>Preview ({previewLanguage[item.id]}):</strong> {previewTranslation[item.id]}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-on-surface-variant text-center py-6">No broadcasts found in execution pipelines.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS GRAPH DETAIL */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-extrabold">Executive Analytics HUD</h2>
                <p className="text-xs text-slate-400 mt-1">Visualize revenue parameters, peak ticketing operations, occupancy heatmaps, and load capacities.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Ticket Sales Line */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 h-80 flex flex-col shadow-sm">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Peak Booking Load Hours</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlyBookingData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="time" stroke="#7a7582" fontSize={10} />
                        <YAxis stroke="#7a7582" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbc4d2', color: '#1d1b20' }} />
                        <Line type="monotone" dataKey="bookings" stroke="#ba1a1a" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Stadiums representation */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 h-80 flex flex-col shadow-sm">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Popular Matches Yield Ratio</h3>
                  <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occupancyChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" stroke="#7a7582" fontSize={9} />
                        <YAxis stroke="#7a7582" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbc4d2', color: '#1d1b20' }} />
                        <Bar dataKey="sold" name="Tickets Redeemed" fill="#765b00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Simulated Stadium Load Heatmap grid */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Stadium Concourse Occupancy Heatmap</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: 'Concourse North (Gate A)', level: '85% Load', status: 'High', color: 'bg-tertiary/10 text-tertiary border-tertiary/30' },
                    { name: 'Concourse East (Gate B)', level: '94% Load', status: 'Near Critical', color: 'bg-error/15 text-error border-error/30' },
                    { name: 'Concourse South (Gate C)', level: '45% Load', status: 'Normal', color: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30' },
                    { name: 'Concourse West (Gate D)', level: '62% Load', status: 'Normal', color: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30' },
                  ].map((heat, idx) => (
                    <div key={idx} className={`p-5 rounded-xl border flex flex-col gap-2 ${heat.color}`}>
                      <span className="font-bold text-xs text-on-surface">{heat.name}</span>
                      <div className="text-lg font-extrabold mt-1">{heat.level}</div>
                      <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">{heat.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admins' && user?.role === 'primary_admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn">
              {/* Creator Form */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant pb-3">Create Secondary Admin</h3>
                <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-admin-name-3">Admin Name</label>
                    <input id="admindashboard-admin-name-3"
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Sarah Chief"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-admin-username-4">Admin Username</label>
                    <input id="admindashboard-admin-username-4"
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. sarah2"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-admin-password-5">Admin Password</label>
                    <input id="admindashboard-admin-password-5"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-xs text-on-surface focus:border-primary outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    Add Secondary Administrator
                  </button>
                </form>
              </div>

              {/* Admin registry list */}
              <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant pb-3">Active Administrator Directory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-outline-variant text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                        <th className="p-4">Admin Name</th>
                        <th className="p-4">Username</th>
                        <th className="p-4">Authorization Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-on-surface">
                      {admins.map(adm => (
                        <tr key={adm.id} className="border-b border-outline-variant hover:bg-surface-container transition">
                          <td className="p-4 font-bold">{adm.name} {adm.id === user?.id && <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-semibold ml-2">YOU</span>}</td>
                          <td className="p-4 text-on-surface-variant font-semibold">{adm.username}</td>

                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${adm.role === 'primary_admin' ? 'bg-primary/10 text-primary' : 'bg-primary-container/20 text-primary-fixed-dim'}`}>
                              {adm.role === 'primary_admin' ? 'Primary Admin' : 'Secondary Admin'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase">
                              {adm.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end">
                            {adm.id !== user?.id && adm.role === 'secondary_admin' ? (
                              <button
                                onClick={() => handleDeleteAdmin(adm.id)}
                                className="px-3 py-1.5 bg-error-container border border-error/20 text-error hover:bg-error/10 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                              </button>
                            ) : (
                              <span className="text-on-surface-variant text-[10px] italic">Access Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </div>
      </main>

      {/* ========================================================
          CREATE / EDIT MATCH DIALOG MODAL
          ======================================================== */}
      {matchModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant max-w-xl w-full p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
            
            {/* Close */}
            <button
              onClick={() => { setMatchModalOpen(false); setEditingMatch(null); }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface text-lg font-bold"
              aria-label="Close match form dialog"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-6 text-on-surface text-center">
              {editingMatch ? 'Modify Match Event Parameters' : 'Create Tournament Match Event'}
            </h3>

            <form onSubmit={handleMatchSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-home-team-roster-6">Home Team Roster</label>
                <input id="admindashboard-home-team-roster-6"
                  type="text"
                  required
                  value={formHomeTeam}
                  onChange={(e) => setFormHomeTeam(e.target.value)}
                  placeholder="e.g. Argentina"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-home-team-emoji-flag-7">Home Team Emoji Flag</label>
                <input id="admindashboard-home-team-emoji-flag-7"
                  type="text"
                  required
                  value={formHomeFlag}
                  onChange={(e) => setFormHomeFlag(e.target.value)}
                  placeholder="e.g. 🇦🇷"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-away-team-roster-8">Away Team Roster</label>
                <input id="admindashboard-away-team-roster-8"
                  type="text"
                  required
                  value={formAwayTeam}
                  onChange={(e) => setFormAwayTeam(e.target.value)}
                  placeholder="e.g. France"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-away-team-emoji-flag-9">Away Team Emoji Flag</label>
                <input id="admindashboard-away-team-emoji-flag-9"
                  type="text"
                  required
                  value={formAwayFlag}
                  onChange={(e) => setFormAwayFlag(e.target.value)}
                  placeholder="e.g. 🇫🇷"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-tournament-date-10">Tournament Date</label>
                <input id="admindashboard-tournament-date-10"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-kickoff-time-11">Kickoff Time</label>
                <input id="admindashboard-kickoff-time-11"
                  type="text"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="e.g. 18:00"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-stadium-arena-12">Stadium Arena</label>
                <input id="admindashboard-stadium-arena-12"
                  type="text"
                  required
                  value={formStadium}
                  onChange={(e) => setFormStadium(e.target.value)}
                  placeholder="e.g. MetLife Stadium"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-base-ticket-price-13">Base Ticket Price ($)</label>
                <input id="admindashboard-base-ticket-price-13"
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseInt(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-total-seating-capacity-14">Total Seating Capacity</label>
                <input id="admindashboard-total-seating-capacity-14"
                  type="number"
                  required
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(parseInt(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="admindashboard-sales-gate-control-15">Sales Gate Control</label>
                <select id="admindashboard-sales-gate-control-15"
                  value={formSalesOpen ? 'open' : 'closed'}
                  onChange={(e) => setFormSalesOpen(e.target.value === 'open')}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="open">Open (Enable Bookings)</option>
                  <option value="closed">Closed (Block Bookings)</option>
                </select>
              </div>

              <div className="sm:col-span-2 mt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => { setMatchModalOpen(false); setEditingMatch(null); }}
                  className="flex-1 border border-outline-variant py-3 rounded-2xl text-xs font-bold text-on-surface bg-surface-container hover:bg-surface-container-high transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  {editingMatch ? 'Save Modifications' : 'Create Match Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
