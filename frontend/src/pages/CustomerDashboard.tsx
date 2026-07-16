import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES_LIST } from '../context/LanguageContext';
import { Match, Booking, mockDb } from '../services/mockDb';
import { ssApi, MessageHistory, FAQItem, AnnouncementItem, ItineraryPlan } from '../services/api';
import { SeatSelector } from '../components/StadiumMap/SeatSelector';
import {
  Compass, Ticket, ClipboardList, MessageSquare, Calendar, Megaphone,
  Settings, LogOut, Search, MapPin, CalendarDays,
  CloudSun, Volume2, Clock, QrCode, Download, Trash2, Globe
} from 'lucide-react';
import stadiumAerial from '../assets/stadium_aerial.png';

export const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'book' | 'bookings' | 'chat' | 'planner' | 'announcements' | 'settings'>('dashboard');

  // Booking seat selection subview state
  const [selectedMatchForSeats, setSelectedMatchForSeats] = useState<Match | null>(null);

  // Core API Lists
  const [matches, setMatches] = useState<Match[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  
  // Search & Filter match states
  const [searchQuery, setSearchQuery] = useState('');
  const [stadiumFilter, setStadiumFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // AI Chat State
  const [conversationId] = useState(() => 'conv_customer_' + Math.random().toString(36).substring(2, 9));
  const [chatMessages, setChatMessages] = useState<MessageHistory[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // AI Planner States
  const [plannerGate, setPlannerGate] = useState('Gate A');
  const [plannerSection, setPlannerSection] = useState('104');
  const [plannerRow, setPlannerRow] = useState('12');
  const [plannerSeat, setPlannerSeat] = useState('25');
  const [plannerParking, setPlannerParking] = useState('Parking Lot North A');
  const [plannerKickoff, setPlannerKickoff] = useState('18:00');
  const [plannerGatesOpen, setPlannerGatesOpen] = useState('15:00');
  const [plannerBuffer, setPlannerBuffer] = useState('early');
  const [activePlan, setActivePlan] = useState<ItineraryPlan | null>(null);
  const [plannerSituation, setPlannerSituation] = useState('');
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);

  // Announcement Translating state
  const [announcementTranslations, setAnnouncementTranslations] = useState<Record<number, string>>({});

  // Fetch initial data
  const loadInitialData = async () => {
    setMatches(mockDb.getMatches());
    if (user) {
      setMyBookings(mockDb.getBookings().filter(b => b.userId === user.id));
    }
    try {
      const announceHistory = await ssApi.getAnnouncements();
      setAnnouncements(announceHistory.filter(a => a.status === 'approved'));
      setFaqs(await ssApi.getFaqs());
    } catch (e) {
      console.warn("Failed fetching backend announcements/FAQs:", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [user, activeTab]);

  // Load chat history once
  useEffect(() => {
    if (activeTab === 'chat' && chatMessages.length === 0) {
      ssApi.getChatHistory(conversationId).then(history => {
        if (history.length > 0) {
          setChatMessages(history);
        } else {
          setChatMessages([
            {
              conversation_id: conversationId,
              role: 'assistant',
              content: 'Welcome to the FIFA World Cup smart arena assistant. How can I assist your match day experience? Ask me about parking, gates, halal food, or emergency exits.',
              created_at: new Date().toISOString()
            }
          ]);
        }
      });
    }
  }, [activeTab]);

  // Handle Match Booking confirmation
  const handleBookingConfirm = (selectedSeats: string[], total: number) => {
    if (!user || !selectedMatchForSeats) return;
    mockDb.addBooking(user.id, selectedMatchForSeats.id, selectedSeats, total);
    setSelectedMatchForSeats(null);
    setActiveTab('bookings');
    loadInitialData();
  };

  // Cancel Booking
  const handleBookingCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this ticket booking? You will receive a mock refund.')) {
      mockDb.cancelBooking(bookingId);
      loadInitialData();
    }
  };

  // Chat message send
  const handleSendChatMessage = async (msgOverride?: string) => {
    const text = msgOverride || chatInput.trim();
    if (!text || !user) return;
    if (!msgOverride) setChatInput('');

    // Append user msg
    const userMsg: MessageHistory = {
      conversation_id: conversationId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const reply = await ssApi.sendChatMessage({
        user_id: user.id,
        conversation_id: conversationId,
        message: text
      });
      setChatMessages(prev => [...prev, {
        conversation_id: conversationId,
        role: 'assistant',
        content: reply.response,
        created_at: reply.timestamp
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        conversation_id: conversationId,
        role: 'assistant',
        content: 'System Error: Connection to AI core timed out. Please retry.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Create Timeline Plan
  const handleCreateItinerary = async () => {
    if (!user) return;
    setPlannerLoading(true);
    try {
      const currentMatch = matches[0] || { time: plannerKickoff };
      const plan = await ssApi.createPlan(
        user.id,
        {
          gate: plannerGate,
          section: plannerSection,
          row: plannerRow,
          seat: plannerSeat
        },
        plannerParking,
        currentMatch as Match,
        { arrival_buffer: plannerBuffer }
      );
      setActivePlan(plan);
      setPlannerSituation('');
    } catch (e) {
      alert('AI Planner engine failed to construct timeline.');
    } finally {
      setPlannerLoading(false);
    }
  };

  // Update Itinerary
  const handleAdjustItinerary = async () => {
    if (!activePlan) return;
    const updateText = plannerSituation.trim();
    if (!updateText) return;
    setPlannerLoading(true);
    try {
      const plan = await ssApi.updatePlan(activePlan.planner_id, updateText);
      setActivePlan(plan);
      setPlannerSituation('');
    } catch (e) {
      alert('AI Planner adjust command returned an error.');
    } finally {
      setPlannerLoading(false);
    }
  };

  // Translate Announcement Card
  const handleTranslateCard = async (announceId: number, targetLang: string) => {
    if (!targetLang) return;
    setAnnouncementTranslations(prev => ({ ...prev, [announceId]: 'Translating...' }));
    try {
      const translation = await ssApi.translateAnnouncement(announceId, targetLang);
      setAnnouncementTranslations(prev => ({ ...prev, [announceId]: translation }));
    } catch (e) {
      setAnnouncementTranslations(prev => ({ ...prev, [announceId]: 'Translation failed.' }));
    }
  };

  // Matches filter math
  const getFilteredMatches = () => {
    return matches.filter(m => {
      const matchQuery = `${m.homeTeam} ${m.awayTeam} ${m.stadium}`.toLowerCase();
      const matchesSearch = matchQuery.includes(searchQuery.toLowerCase());
      const matchesStadium = stadiumFilter === '' || m.stadium.includes(stadiumFilter);
      const matchesDate = dateFilter === '' || m.date === dateFilter;
      return matchesSearch && matchesStadium && matchesDate;
    });
  };

  // SVG route drawer coordinates mapping
  const getRoutePoints = () => {
    const points: any = {
      parking: {
        "Parking Lot North A": { x: 300, y: 140 },
        "Parking Lot East B": { x: 500, y: 400 },
        "Parking Lot South D": { x: 300, y: 660 },
        "Parking Lot West C": { x: 100, y: 400 }
      },
      gate: {
        "Gate A": { x: 300, y: 220 },
        "Gate B": { x: 450, y: 400 },
        "Gate C": { x: 300, y: 580 },
        "Gate D": { x: 150, y: 400 }
      },
      section: {
        "104": { x: 300, y: 280 },
        "106": { x: 390, y: 400 },
        "110": { x: 300, y: 520 },
        "220": { x: 210, y: 400 }
      }
    };
    const parkPt = points.parking[plannerParking] || points.parking["Parking Lot North A"];
    const gatePt = points.gate[plannerGate] || points.gate["Gate A"];
    const secPt = points.section[plannerSection] || points.section["104"];

    return { parkPt, gatePt, secPt };
  };

  const drawRoutePath = () => {
    if (!plannerParking || !plannerGate || !plannerSection) return '';
    const { parkPt, gatePt, secPt } = getRoutePoints();
    return `M ${parkPt.x} ${parkPt.y} L ${gatePt.x} ${gatePt.y} L ${secPt.x} ${secPt.y}`;
  };

  const { parkPt, gatePt, secPt } = getRoutePoints();

  return (
    <div className="flex w-full h-screen bg-surface font-sans text-on-surface overflow-hidden relative">
      {/* Sidebar Navigation - matches ticket_booking.html sidebar styling */}
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
              { id: 'dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
              { id: 'book', label: t('nav.bookTickets'), icon: 'confirmation_number' },
              { id: 'bookings', label: t('nav.myBookings'), icon: 'sticky_note_2' },
              { id: 'chat', label: t('nav.chatbot'), icon: 'chat' },
              { id: 'planner', label: t('nav.planner'), icon: 'calendar_month' },
              { id: 'announcements', label: t('nav.announcements'), icon: 'campaign' },
              { id: 'settings', label: t('nav.settings'), icon: 'settings' }
            ].map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setSelectedMatchForSeats(null); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white active-nav-glow font-bold' : 'text-on-surface-variant/60 hover:text-white hover:bg-white/10'}`}
                >
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="mt-auto">
          <div className="bg-surface-container-lowest rounded-2xl p-3 flex items-center justify-between shadow-sm border border-outline-variant/20">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                <span className="material-symbols-outlined text-white">person</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface leading-tight truncate">{user?.name}</p>
                <p className="text-[10px] text-on-surface-variant font-medium truncate">@{user?.username}</p>
              </div>
            </div>
            <button onClick={logout} className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-md">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden relative">
        {/* Top Header Status Bar */}
        <header className="h-16 border-b border-outline-variant flex items-center justify-between px-8 bg-surface/85 backdrop-blur-md z-40 flex-shrink-0">
          {/* Live Score Widget */}
          <div className="score-badge-glow rounded-full px-4 py-1.5 flex items-center space-x-4 text-xs font-bold shadow-sm">
            <span className="text-on-surface">ARG</span>
            <span className="text-primary font-black">2 - 2</span>
            <span className="text-on-surface">FRA</span>
            <span className="text-on-surface-variant font-normal">82'</span>
          </div>

          {/* Stats & Language */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-6 text-xs font-medium">
              <div className="flex flex-col items-end">
                <span className="text-on-surface-variant uppercase tracking-tighter text-[9px] font-bold">Stadium Occupancy</span>
                <div className="flex items-center space-x-2">
                  <span className="text-on-surface font-bold">94%</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-on-surface-variant uppercase tracking-tighter text-[9px] font-bold">Arena Weather</span>
                <div className="flex items-center space-x-2">
                  <span className="text-on-surface font-bold">28°C Clear</span>
                  <span className="material-symbols-outlined text-sm text-tertiary">wb_sunny</span>
                </div>
              </div>
            </div>
            
            <button className="flex items-center space-x-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface transition-colors cursor-pointer">
              <Globe className="w-4 h-4 text-primary" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-on-surface border-none outline-none cursor-pointer"
              >
                {LANGUAGES_LIST.map((l) => (
                  <option key={l.code} value={l.code} className="bg-surface text-on-surface">
                    {l.label}
                  </option>
                ))}
              </select>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-grow p-8 overflow-y-auto relative bg-background">
          {selectedMatchForSeats ? (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">{selectedMatchForSeats.homeFlag} {selectedMatchForSeats.homeTeam} vs {selectedMatchForSeats.awayTeam} {selectedMatchForSeats.awayFlag}</h2>
                  <p className="text-xs text-on-surface-variant mt-1">{selectedMatchForSeats.stadium} • {selectedMatchForSeats.date} @ {selectedMatchForSeats.time}</p>
                </div>
                <button
                  onClick={() => setSelectedMatchForSeats(null)}
                  className="px-4 py-2 border border-outline-variant bg-surface-container rounded-xl hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                >
                  Cancel Selection
                </button>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm">
                <SeatSelector
                  matchId={selectedMatchForSeats.id}
                  onConfirmSeats={handleBookingConfirm}
                  onCancel={() => setSelectedMatchForSeats(null)}
                />
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD HOME */}
              {activeTab === 'dashboard' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  {/* Hero Box */}
                  <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-sm text-left relative overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(103,80,164,0.04),transparent)]">
                    <div className="absolute top-0 right-0 w-44 h-44 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    <h2 className="text-3xl font-black text-on-surface text-gradient">{t('dash.welcome')}</h2>
                    <p className="text-sm text-on-surface-variant mt-2 max-w-xl leading-relaxed">{t('dash.subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Matches List */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">{t('dash.upcomingMatches')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {matches.slice(0, 2).map(m => (
                          <div key={m.id} className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 hover:border-primary/30 transition-all">
                            <div className="flex justify-between text-xs text-primary font-bold mb-2">
                              <span>Match Day ID: {m.id.toUpperCase()}</span>
                              <span className="text-on-surface font-black">${m.ticketPrice}</span>
                            </div>
                            <div className="flex items-center gap-3 my-3">
                              <span className="text-2xl">{m.homeFlag}</span>
                              <span className="font-bold text-sm text-on-surface">{m.homeTeam} vs {m.awayTeam}</span>
                              <span className="text-2xl">{m.awayFlag}</span>
                            </div>
                            <div className="text-xs text-on-surface-variant flex items-center gap-2 border-t border-outline-variant pt-3">
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              <span className="truncate">{m.stadium}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Safety Alert Panel */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">{t('dash.announcements')}</h3>
                      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex flex-col gap-4 min-h-[160px]">
                        {announcements.length > 0 ? (
                          announcements.slice(0, 2).map((item) => (
                            <div key={item.id} className="border-b border-outline-variant pb-3 last:border-b-0 last:pb-0">
                              <div className="flex justify-between text-[10px] font-bold text-error mb-1 uppercase">
                                <span>{item.category}</span>
                                <span>APPROVED ALERT</span>
                              </div>
                              <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{item.original_text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-on-surface-variant text-center my-auto">No safety alerts currently active.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Planner Suggestions box */}
                  <div className="bg-primary-container/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                    <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-md">psychology</span>
                      {t('dash.aiSuggestions')}
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <p className="text-xs text-on-surface-variant max-w-xl">
                        AI analysis shows heavy traffic forecasted around MetLife South exits post 20:00. Enter your ticket gate to pre-calculate crowd routing.
                      </p>
                      <button
                        onClick={() => setActiveTab('planner')}
                        className="btn-primary text-xs font-bold px-5 py-2.5 rounded-xl flex-shrink-0"
                      >
                        Launch AI Planner
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BOOK TICKETS */}
              {activeTab === 'book' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-extrabold text-on-surface">{t('book.title')}</h2>
                    <p className="text-xs text-on-surface-variant mt-1">{t('book.subtitle')}</p>
                  </div>

                  {/* Filters HUD */}
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-wrap gap-4 items-center">
                    <div className="flex-grow min-w-[200px] relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('book.search')}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface focus:ring-primary focus:border-primary transition-all outline-none"
                      />
                    </div>
                    <select
                      value={stadiumFilter}
                      onChange={(e) => setStadiumFilter(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                    >
                      <option value="">{t('book.filterStadium')}</option>
                      <option value="MetLife">MetLife Stadium</option>
                      <option value="SoFi">SoFi Stadium</option>
                      <option value="BC Place">BC Place</option>
                      <option value="Azteca">Azteca Stadium</option>
                    </select>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer"
                    />
                  </div>

                  {/* Matches Grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getFilteredMatches().map(m => (
                      <article key={m.id} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 relative overflow-hidden group hover:border-primary transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant mb-4 uppercase">
                            <span className="flex items-center gap-1 text-primary">
                              <CalendarDays className="w-3.5 h-3.5" /> {m.date} @ {m.time}
                            </span>
                            <span className="text-primary font-black uppercase">{m.availableSeats} Seats Left</span>
                          </div>

                          <div className="flex items-center mb-6 mt-4">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-3xl font-black text-on-surface">{m.homeFlag}</span>
                              <span className="text-xl font-bold text-on-surface">{m.homeTeam}</span>
                            </div>
                            <span className="mx-4 text-primary opacity-50 font-bold italic">VS</span>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-3xl font-black text-on-surface">{m.awayFlag}</span>
                              <span className="text-xl font-bold text-on-surface">{m.awayTeam}</span>
                            </div>
                          </div>

                          <div className="border-t border-outline-variant pt-4 flex items-center space-x-2 text-on-surface-variant text-sm mb-6">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span>{m.stadium}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-outline-variant pt-4 mt-auto">
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">{t('book.ticketPrice')}</p>
                            <p className="text-2xl font-black text-primary">${m.ticketPrice}</p>
                          </div>
                          {m.salesOpen ? (
                            <button
                              onClick={() => setSelectedMatchForSeats(m)}
                              className="btn-primary px-6 py-3 rounded-xl flex items-center space-x-2 font-bold shadow-lg"
                            >
                              <span className="material-symbols-outlined text-sm">confirmation_number</span>
                              <span>{t('book.button')}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant px-4 py-2 border border-outline-variant rounded-xl bg-surface-container cursor-not-allowed">
                              {t('book.closed')}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MY BOOKINGS */}
              {activeTab === 'bookings' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-extrabold text-on-surface">{t('my.title')}</h2>
                    <p className="text-xs text-on-surface-variant mt-1">Manage, print, and view QR passes for active matches.</p>
                  </div>

                  <div className="flex flex-col gap-6">
                    {myBookings.length > 0 ? (
                      myBookings.map(b => (
                        <div key={b.id} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-start md:items-center">
                          <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${b.bookingStatus === 'cancelled' ? 'bg-error' : 'bg-primary'}`} />
                          
                          {/* QR Mock */}
                          <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center flex-shrink-0 relative border border-outline-variant group">
                            <QrCode className="w-full h-full text-slate-900" />
                            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-white text-center p-2 cursor-pointer">
                              Click to view printable PDF
                            </div>
                          </div>

                          {/* Ticket Information */}
                          <div className="flex-grow flex flex-col gap-2 min-w-0">
                            <div className="flex flex-wrap gap-2 items-center text-xs font-bold">
                              <span className="text-primary uppercase">Invoice: {b.id}</span>
                              <span className="text-on-surface-variant">•</span>
                              <span className="text-on-surface-variant">Date: {new Date(b.bookingDate).toLocaleDateString()}</span>
                              <span className="text-on-surface-variant">•</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${b.bookingStatus === 'active' ? 'bg-emerald-500/20 text-emerald-700' : 'bg-error/20 text-error'}`}>
                                {b.bookingStatus}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-lg text-on-surface truncate mt-1">
                              {b.matchDetails.homeTeam} vs {b.matchDetails.awayTeam}
                            </h3>

                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">location_on</span> {b.matchDetails.stadium}
                            </p>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">schedule</span> {b.matchDetails.date} @ {b.matchDetails.time}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-2 border-t border-outline-variant pt-3 text-xs">
                              <div>
                                <span className="text-on-surface-variant font-bold uppercase text-[9px] tracking-wider">{t('my.gate')}</span>
                                <div className="font-semibold text-on-surface mt-0.5">{b.gateNumber}</div>
                              </div>
                              <div>
                                <span className="text-on-surface-variant font-bold uppercase text-[9px] tracking-wider">{t('my.seat')}</span>
                                <div className="font-semibold text-primary mt-0.5">{b.seats.join(', ')}</div>
                              </div>
                              <div>
                                <span className="text-on-surface-variant font-bold uppercase text-[9px] tracking-wider">Total Charge</span>
                                <div className="font-semibold text-on-surface mt-0.5">${b.totalPrice}</div>
                              </div>
                            </div>
                          </div>

                          {/* Action Items */}
                          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto flex-shrink-0">
                            <button
                              onClick={() => alert(`Generating print layout for ${b.id}...`)}
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-outline-variant hover:border-primary/40 bg-surface-container-low py-2.5 px-4 rounded-xl text-xs font-semibold text-on-surface transition"
                            >
                              <Download className="w-4 h-4 text-primary" /> {t('my.download')}
                            </button>
                            {b.bookingStatus === 'active' && (
                              <button
                                onClick={() => handleBookingCancel(b.id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-outline-variant hover:border-error/40 hover:bg-error/10 py-2.5 px-4 rounded-xl text-xs font-semibold text-error transition"
                              >
                                <Trash2 className="w-4 h-4" /> {t('my.cancel')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-12 text-center text-on-surface-variant">
                        <Ticket className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                        <p className="text-sm">No ticket bookings found on your user account.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: AI STADIUM CHATBOT */}
              {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)] animate-fadeIn">
                  {/* Chat interface */}
                  <div className="lg:col-span-2 bg-surface-container-low/50 border border-outline-variant/40 rounded-2xl relative flex flex-col h-full">
                    {/* Chat Header */}
                    <div className="p-6 border-b border-outline-variant/20">
                      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface">{t('chat.header')}</h2>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`max-w-2xl p-6 rounded-2xl relative ${msg.role === 'user' ? 'bg-primary/5 border border-primary/20 self-end ml-auto rounded-tr-none' : 'bg-surface-container border border-outline-variant/30 self-start mr-auto rounded-tl-none'}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-primary' : 'text-primary-fixed-dim'}`}>
                              {msg.role === 'user' ? 'You' : 'Stadium Neural Assistant'}
                            </span>
                          </div>
                          <p className="text-on-surface leading-relaxed text-sm">{msg.content}</p>
                          <span className="absolute bottom-4 right-6 text-[10px] font-mono text-on-surface-variant/60">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="bg-surface-container border border-outline-variant/30 p-4 rounded-2xl self-start mr-auto flex items-center gap-3 text-xs text-on-surface-variant max-w-[200px]">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></span>
                          Thinking...
                        </div>
                      )}
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-6 border-t border-outline-variant/20">
                      <div className="relative flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                            placeholder={t('chat.placeholder')}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-6 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/50"
                          />
                        </div>
                        <button
                          onClick={() => handleSendChatMessage()}
                          className="brand-gradient px-10 py-4 rounded-xl font-bold text-white text-sm shadow-[0_4px_20px_rgba(103,80,164,0.3)] hover:scale-[1.02] transition-transform active:scale-[0.98]"
                        >
                          {t('chat.send')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Suggested FAQs Sidebar */}
                  <aside className="w-full flex flex-col gap-6" data-purpose="faq-sidebar">
                    <div className="bg-surface-container-low/50 border border-outline-variant/40 rounded-2xl h-full flex flex-col">
                      <div className="p-6 border-b border-outline-variant/20">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface">FAQ Suggestion Index</h3>
                      </div>
                      <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        {faqs.map(faq => {
                          let catBadge = 'bg-primary-container text-on-primary-container';
                          if (faq.category === 'emergency') catBadge = 'bg-error-container text-on-error-container';
                          if (faq.category === 'food') catBadge = 'bg-tertiary-container text-on-tertiary-container';
                          if (faq.category === 'connectivity') catBadge = 'bg-secondary-container text-on-secondary-container';

                          return (
                            <div
                              key={faq.id}
                              onClick={() => handleSendChatMessage(faq.question)}
                              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 group cursor-pointer hover:border-primary/50 hover:bg-surface-container transition-all shadow-sm hover:scale-[1.02]"
                            >
                              <h4 className="text-sm font-black text-on-surface mb-3">{faq.question}</h4>
                              <div className="flex items-center">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${catBadge}`}>
                                  {faq.category}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                </div>
              )}

              {/* TAB 5: AI MATCH DAY PLANNER */}
              {activeTab === 'planner' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="mb-xl">
                    <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">{t('plan.title')}</h2>
                    <p className="text-sm text-on-surface-variant">{t('plan.subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Itinerary Form */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                      <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <span className="material-symbols-outlined text-primary">route</span>
                          <h3 className="text-lg font-bold text-on-surface">Itinerary Details</h3>
                        </div>
                        <form className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-ticket-gate-1">Ticket Gate</label>
                              <select id="customerdashboard-ticket-gate-1"
                                value={plannerGate}
                                onChange={(e) => setPlannerGate(e.target.value)}
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                              >
                                <option value="Gate A">Gate A (North)</option>
                                <option value="Gate B">Gate B (East)</option>
                                <option value="Gate C">Gate C (South)</option>
                                <option value="Gate D">Gate D (West)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-section-2">Section</label>
                              <select id="customerdashboard-section-2"
                                value={plannerSection}
                                onChange={(e) => setPlannerSection(e.target.value)}
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                              >
                                <option value="104">Section 104 (North)</option>
                                <option value="106">Section 106 (East)</option>
                                <option value="110">Section 110 (South)</option>
                                <option value="220">Section 220 (West)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-row-3">Row</label>
                              <input id="customerdashboard-row-3"
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                                type="text"
                                value={plannerRow}
                                onChange={(e) => setPlannerRow(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-seat-number-4">Seat Number</label>
                              <input id="customerdashboard-seat-number-4"
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                                type="text"
                                value={plannerSeat}
                                onChange={(e) => setPlannerSeat(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-parking-lot-5">Parking Lot</label>
                              <select id="customerdashboard-parking-lot-5"
                                value={plannerParking}
                                onChange={(e) => setPlannerParking(e.target.value)}
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                              >
                                <option value="Parking Lot North A">Parking Lot North A</option>
                                <option value="Parking Lot East B">Parking Lot East B</option>
                                <option value="Parking Lot South D">Parking Lot South D</option>
                                <option value="Parking Lot West C">Parking Lot West C</option>
                              </select>
                            </div>
                          </div>
                          <div className="h-[1px] bg-outline-variant my-4"></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-gates-open-6">Gates Open</label>
                              <input id="customerdashboard-gates-open-6"
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                                type="text"
                                value={plannerGatesOpen}
                                onChange={(e) => setPlannerGatesOpen(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-2" htmlFor="customerdashboard-kickoff-time-7">Kickoff Time</label>
                              <input id="customerdashboard-kickoff-time-7"
                                className="w-full rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md py-3 px-3 outline-none"
                                type="text"
                                value={plannerKickoff}
                                onChange={(e) => setPlannerKickoff(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-4 bg-primary-container/10 rounded-2xl border border-primary-container/20">
                            <input
                              type="checkbox"
                              checked={plannerBuffer === 'early'}
                              onChange={(e) => setPlannerBuffer(e.target.checked ? 'early' : 'standard')}
                              className="w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                              id="arrive-early"
                            />
                            <label className="flex-1 text-xs font-bold text-on-primary-container cursor-pointer select-none" htmlFor="arrive-early">
                              Arrive Early Preference
                            </label>
                            <span className="material-symbols-outlined text-primary text-md" title="AI will suggest pre-match fan zone visits">info</span>
                          </div>

                          <button
                            onClick={handleCreateItinerary}
                            disabled={plannerLoading}
                            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group"
                            type="button"
                          >
                            <span>{plannerLoading ? 'ASSEMBLING...' : 'GENERATE SMART TIMELINE'}</span>
                            <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform text-sm">bolt</span>
                          </button>
                        </form>
                      </section>

                      {/* Auxiliary Pro Tips Card */}
                      <div className="bg-gradient-to-br from-primary-container to-secondary-container p-6 rounded-3xl text-on-primary-container relative overflow-hidden group">
                        <div className="relative z-10">
                          <h4 className="font-bold text-sm mb-2">Pro Tip</h4>
                          <p className="text-xs opacity-90 leading-relaxed">Based on current traffic forecasts for your selected parking lot, we recommend arriving 15 minutes prior to gates opening for the smoothest experience.</p>
                        </div>
                        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-10 rotate-12 transition-transform group-hover:scale-110">tips_and_updates</span>
                      </div>
                    </div>

                    {/* Right Column: Stadium Map */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                      <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant shadow-sm flex-1 flex flex-col min-h-[650px]">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">map</span>
                            <h3 className="text-lg font-bold text-on-surface">Interactive Stadium Map</h3>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={() => setMapZoom(prev => Math.min(prev + 0.25, 2.5))}
                              className="p-2 bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 rounded-xl transition-colors"
                              title="Zoom In"
                              aria-label="Zoom in on stadium map"
                            >
                              <span className="material-symbols-outlined text-on-surface-variant text-md font-bold">zoom_in</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => setMapZoom(prev => Math.max(prev - 0.25, 0.5))}
                              className="p-2 bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 rounded-xl transition-colors"
                              title="Zoom Out"
                              aria-label="Zoom out on stadium map"
                            >
                              <span className="material-symbols-outlined text-on-surface-variant text-md font-bold">zoom_out</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => setMapZoom(1)}
                              className="p-2 bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 rounded-xl transition-colors"
                              title="Reset Zoom"
                              aria-label="Reset stadium map zoom"
                            >
                              <span className="material-symbols-outlined text-on-surface-variant text-md font-bold">my_location</span>
                            </button>
                          </div>
                        </div>

                        {/* Map Container */}
                        <div className="flex-grow relative rounded-3xl overflow-hidden border border-outline-variant min-h-[450px] aspect-[3/4] flex items-center justify-center bg-slate-100 shadow-inner">
                          {/* Map Background Grayscale Photograph */}
                          <div 
                            style={{ 
                              transform: `scale(${mapZoom})`, 
                              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
                            }} 
                            className="absolute inset-0 w-full h-full"
                          >
                            <img 
                              src={stadiumAerial} 
                              className="w-full h-full object-cover grayscale brightness-95 contrast-[1.05]" 
                              alt="Stadium Aerial Map" 
                            />
                            
                            {/* SVG Overlays scaled inside the zoomable container */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 800">
                              {activePlan && (
                                <path 
                                  className="opacity-90" 
                                  d={drawRoutePath()} 
                                  fill="none" 
                                  stroke="#6750A4" 
                                  strokeDasharray="8 6" 
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                >
                                  <animate attributeName="stroke-dashoffset" dur="1.2s" from="28" repeatCount="indefinite" to="0"></animate>
                                </path>
                              )}

                              {/* Point: Parking */}
                              <circle 
                                className="animate-pulse" 
                                cx={parkPt.x} 
                                cy={parkPt.y} 
                                fill="#ba1a1a" 
                                r="11" 
                                stroke="white" 
                                strokeWidth="2.5"
                              />
                              <circle 
                                cx={parkPt.x} 
                                cy={parkPt.y} 
                                fill="#ba1a1a" 
                                r="5" 
                                stroke="white" 
                                strokeWidth="1"
                              />

                              {/* Point: Gate */}
                              <circle 
                                cx={gatePt.x} 
                                cy={gatePt.y} 
                                fill="#765b00" 
                                r="11" 
                                stroke="white" 
                                strokeWidth="2.5"
                              />
                              <circle 
                                cx={gatePt.x} 
                                cy={gatePt.y} 
                                fill="#765b00" 
                                r="5" 
                                stroke="white" 
                                strokeWidth="1"
                              />

                              {/* Point: Seat */}
                              <circle 
                                className="animate-pulse" 
                                cx={secPt.x} 
                                cy={secPt.y} 
                                fill="#0066cc" 
                                r="13" 
                                stroke="white" 
                                strokeWidth="3"
                              />
                              <circle 
                                cx={secPt.x} 
                                cy={secPt.y} 
                                fill="#0066cc" 
                                r="6" 
                                stroke="white" 
                                strokeWidth="1.5"
                              />
                            </svg>
                          </div>

                          {/* Legend Overlay - Transparent with blur and subtle border */}
                          <div className="absolute top-6 left-6 p-4 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm z-10 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#ba1a1a] ring-4 ring-[#ba1a1a]/25"></div>
                              <span className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">Your Parking</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#765b00] ring-4 ring-[#765b00]/25"></div>
                              <span className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">Ticket Gate</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#0066cc] ring-4 ring-[#0066cc]/25"></div>
                              <span className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">Target Section</span>
                            </div>
                          </div>

                          {/* Route Summary Overlay - Premium transparent glassmorphic overlay */}
                          <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg flex items-center justify-between z-10">
                            <div className="flex items-center gap-3.5">
                              <div className="bg-[#6750A4]/15 p-2.5 rounded-xl">
                                <span className="material-symbols-outlined text-[#6750A4] text-xl font-bold">directions_walk</span>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Estimated Walk Time</p>
                                <p className="text-base font-black text-slate-800">8 Minutes</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3.5 border-l border-slate-300/50 pl-6">
                              <div className="bg-amber-500/15 p-2.5 rounded-xl">
                                <span className="material-symbols-outlined text-amber-600 text-xl font-bold">local_parking</span>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Traffic Status</p>
                                <p className="text-base font-black text-amber-600">Moderate</p>
                              </div>
                            </div>
                            
                            <button className="bg-[#E8DEF8] hover:bg-[#D0BCFF] text-[#1D192B] font-black text-xs px-5 py-3.5 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]">
                              View Full Itinerary
                            </button>
                          </div>
                        </div>
                      </section>
                      
                      {/* Timeline Results List */}
                      {activePlan && (
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-fadeIn">
                          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant pb-3">Constructed Chronological Timeline</h3>
                          <div className="relative border-l border-primary/20 pl-6 flex flex-col gap-6 ml-2 mt-4">
                            {[
                              { title: 'Arrival Strategy', text: activePlan.arrival_plan },
                              { title: 'Entrance Gate Routing', text: `Gate Recommendation: ${activePlan.gate_recommendation}` },
                              { title: 'Stadium Route Path', text: activePlan.route },
                              { title: 'Food & Concessions Strategy', text: activePlan.food_timing },
                              { title: 'Exit & Parking Strategy', text: activePlan.exit_strategy },
                            ].map((step, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-primary"></div>
                                <h4 className="font-bold text-xs text-on-surface uppercase">{step.title}</h4>
                                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{step.text}</p>
                              </div>
                            ))}
                          </div>

                          {/* Situation Adjust command input */}
                          <div className="border-t border-outline-variant pt-5 mt-4">
                            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-2" htmlFor="planner-situation-input">{t('plan.situation')}</label>
                            <div className="flex gap-3">
                              <input
                                id="planner-situation-input"
                                type="text"
                                value={plannerSituation}
                                onChange={(e) => setPlannerSituation(e.target.value)}
                                placeholder="e.g. Flight delay, traffic jam, arriving 30 mins late..."
                                className="flex-grow bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                              />
                              <button
                                onClick={handleAdjustItinerary}
                                disabled={plannerLoading || !plannerSituation.trim()}
                                className="bg-surface-container border border-outline-variant hover:border-primary/30 px-5 py-2.5 rounded-xl text-xs font-bold text-on-surface transition disabled:opacity-50"
                              >
                                {t('plan.adjust')}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-extrabold text-on-surface">{t('nav.announcements')}</h2>
                    <p className="text-xs text-on-surface-variant mt-1">Personalized security updates, congestion warnings, and weather alerts.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {announcements.length > 0 ? (
                      announcements.map((item) => {
                        let badgeColor = 'bg-surface-container text-on-surface-variant border-outline-variant';
                        if (item.category === 'congestion') badgeColor = 'bg-primary/10 text-primary border-primary/20';
                        if (item.category === 'emergency') badgeColor = 'bg-error-container text-error border-error/20 animate-pulse';
                        if (item.category === 'weather') badgeColor = 'bg-tertiary-container text-on-tertiary-container border-tertiary-container/20';

                        return (
                          <div key={item.id} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className={`px-2.5 py-1 rounded-full border text-[10px] uppercase font-bold tracking-wider ${badgeColor}`}>
                                {item.category}
                              </span>
                              <span className="text-on-surface-variant font-mono">
                                {new Date(item.created_at).toLocaleDateString()} @ {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-sm text-on-surface leading-relaxed font-semibold">{item.original_text}</p>

                            {/* Translation Option */}
                            <div className="border-t border-outline-variant pt-4 flex flex-wrap justify-between items-center gap-4">
                              <div className="flex items-center gap-2 text-xs">
                                <Volume2 className="w-4 h-4 text-primary" />
                                <span className="text-on-surface-variant">Listen or translate:</span>
                                <select
                                  onChange={(e) => handleTranslateCard(item.id, e.target.value)}
                                  className="bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none cursor-pointer focus:border-primary"
                                >
                                  <option value="">Translate Alert...</option>
                                  <option value="Spanish">Spanish</option>
                                  <option value="French">French</option>
                                  <option value="Arabic">Arabic</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="Portuguese">Portuguese</option>
                                  <option value="German">German</option>
                                  <option value="Japanese">Japanese</option>
                                </select>
                              </div>

                              {announcementTranslations[item.id] && (
                                <div className="w-full text-xs bg-primary/5 border border-primary/20 p-3 rounded-lg text-primary font-medium animate-fadeIn">
                                  {announcementTranslations[item.id]}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-12 text-center text-on-surface-variant">
                        <Megaphone className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                        <p className="text-sm">No safety announcements currently published by stadium control.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: PROFILE & SETTINGS */}
              {activeTab === 'settings' && (
                <div className="flex flex-col gap-6 max-w-xl animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-extrabold text-on-surface">{t('nav.settings')}</h2>
                    <p className="text-xs text-on-surface-variant mt-1">Configure security credentials and match notifications.</p>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 flex flex-col gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">User Profile Card</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white shadow-md">
                          {user?.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-base">{user?.name}</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">@{user?.username}</p>
                          <span className="inline-block mt-2 bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                            Status: {user?.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant pt-6">
                      <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">Preferences</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="font-semibold text-on-surface">Push Notifications</div>
                            <div className="text-on-surface-variant text-[10px] mt-0.5">Receive warnings about stadium crowd congestions.</div>
                          </div>
                          <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary rounded border-outline-variant cursor-pointer" />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="font-semibold text-on-surface">Dark Dashboard Theme</div>
                            <div className="text-on-surface-variant text-[10px] mt-0.5">Toggle luxury dark neon styles.</div>
                          </div>
                          <input type="checkbox" defaultChecked disabled className="w-4 h-4 accent-primary rounded border-outline-variant cursor-not-allowed" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
