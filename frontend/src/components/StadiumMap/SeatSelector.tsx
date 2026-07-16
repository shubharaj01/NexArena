import React, { useState, useEffect } from 'react';
import { Seat, mockDb } from '../../services/mockDb';
import { useLanguage } from '../../context/LanguageContext';
import { Compass, Eye, ShieldAlert, BadgeDollarSign, Footprints, Flame, Users, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SeatSelectorProps {
  matchId: string;
  onConfirmSeats: (selectedSeats: string[], totalPrice: number) => void;
  onCancel: () => void;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({ matchId, onConfirmSeats, onCancel }) => {
  const { t } = useLanguage();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('104');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter States
  const [budgetFilter, setBudgetFilter] = useState(false);
  const [vipFilter, setVipFilter] = useState(false);
  const [accessibleFilter, setAccessibleFilter] = useState(false);
  const [familyFilter, setFamilyFilter] = useState(false);
  const [exitFilter, setExitFilter] = useState(false);
  const [foodFilter, setFoodFilter] = useState(false);

  // AI Comparison
  const [aiCompareActive, setAiCompareActive] = useState(false);
  const [aiSelection, setAiSelection] = useState<'view' | 'budget' | 'exit' | null>(null);

  useEffect(() => {
    // Load seats
    const matchSeats = mockDb.getSeatsForMatch(matchId);
    setSeats(matchSeats);
    setSelectedSeats([]);
  }, [matchId]);

  // Filters calculation
  const getFilteredSeats = () => {
    let result = seats.filter(s => s.section === selectedSection);

    if (budgetFilter) {
      // Find cheaper seats (typically non-VIP, non-VIP rows are row 2-4)
      result = result.filter(s => s.price <= 250);
    }
    if (vipFilter) {
      result = result.filter(s => s.status === 'vip');
    }
    if (accessibleFilter) {
      result = result.filter(s => s.status === 'accessible');
    }
    if (familyFilter) {
      // Family seats: blocks of available seats away from corner nodes
      result = result.filter(s => parseInt(s.number) >= 3 && parseInt(s.number) <= 8);
    }
    if (exitFilter) {
      // Near exits: seats with numbers 1, 2, 9, 10
      result = result.filter(s => s.number === '1' || s.number === '2' || s.number === '9' || s.number === '10');
    }
    if (foodFilter) {
      // Near food courts: sections 106 and 220 (stubbed layout proximity)
      result = result.filter(s => s.section === '106' || s.section === '220');
    }

    return result;
  };

  // Toggle seat selection
  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'reserved') return;

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(prev => prev.filter(id => id !== seat.id));
    } else {
      setSelectedSeats(prev => [...prev, seat.id]);
    }
  };

  // Dragging for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Pricing math
  const getSelectedPrice = () => {
    return seats
      .filter(s => selectedSeats.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  };

  // AI recommendations matching criteria
  const aiRecommendations = {
    view: {
      name: 'Best View (VIP Front Row)',
      seatId: `${selectedSection}-1-5`,
      desc: 'Optimal 50-yard line perspective, cushioned VIP row.',
      price: 450,
      rating: '⭐⭐⭐⭐⭐',
      exitDistance: 'Medium',
      crowdRating: 'Low'
    },
    budget: {
      name: 'Best Budget (Standard Tier)',
      seatId: `${selectedSection}-3-4`,
      desc: 'Exceptional visual angle for standard entry pricing.',
      price: 250,
      rating: '⭐⭐⭐⭐',
      exitDistance: 'Close',
      crowdRating: 'Medium'
    },
    exit: {
      name: 'Fast Exit Route (Near Concierge Gate)',
      seatId: `${selectedSection}-5-1`,
      desc: 'Closest row to Gate entrance A/B stairs. Quick transit.',
      price: 225,
      rating: '⭐⭐⭐',
      exitDistance: 'Very Close',
      crowdRating: 'Lowest'
    }
  };

  // Select AI Recommended Seat
  const selectRecommendation = (type: 'view' | 'budget' | 'exit') => {
    const rec = aiRecommendations[type];
    const matchSeat = seats.find(s => s.id === rec.seatId);
    if (matchSeat && matchSeat.status !== 'booked') {
      setSelectedSeats([matchSeat.id]);
      setAiSelection(type);
    }
  };

  const handleSubmit = () => {
    if (selectedSeats.length === 0) return;
    onConfirmSeats(selectedSeats, getSelectedPrice());
  };

  const renderSeatMapHUD = () => {
    return (
      <div className="flex flex-wrap gap-4 text-xs font-semibold py-3 border-y border-white/5 mb-6 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block border border-emerald-400"></span>
          <span>{t('seat.available')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block border border-amber-400"></span>
          <span>{t('seat.reserved')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-red-500 inline-block border border-red-400"></span>
          <span>{t('seat.booked')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-blue-500 inline-block border border-blue-400"></span>
          <span>{t('seat.vip')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-purple-500 inline-block border border-purple-400"></span>
          <span>{t('seat.accessible')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
      {/* Stadium Grid Area (Interactive Seating Map) */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="glass-card p-6 flex flex-col relative overflow-hidden h-[500px]">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-black/40 p-2 rounded-xl border border-white/10">
            <button type="button" onClick={() => setZoom(prev => Math.min(prev + 0.2, 2.5))} className="hover:text-brand-cyan transition" aria-label="Zoom in on seat map"><ZoomIn className="w-4 h-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.6))} className="hover:text-brand-cyan transition" aria-label="Zoom out on seat map"><ZoomOut className="w-4 h-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="hover:text-brand-cyan transition" aria-label="Reset seat map zoom and position"><RotateCcw className="w-4 h-4" aria-hidden="true" /></button>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{t('seat.title')} - Section {selectedSection}</h3>
          <p className="text-xs text-slate-400 mb-4">{t('seat.subtitle')}</p>

          {renderSeatMapHUD()}

          {/* Interactive Seat Viewport */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-grow bg-slate-950/70 border border-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            {/* Field representation */}
            <div className="absolute top-0 w-1/2 h-4 bg-emerald-950/30 border-b border-white/10 rounded-b-xl flex items-center justify-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest pointer-events-none">
              ⚽ Pitch Direction
            </div>

            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              className="grid grid-cols-10 gap-3 p-8"
            >
              {getFilteredSeats().map((seat) => {
                const isSelected = selectedSeats.includes(seat.id);
                
                // Color codes
                let bgClass = 'bg-emerald-500 border-emerald-400 hover:bg-emerald-400';
                if (seat.status === 'vip') bgClass = 'bg-blue-600 border-blue-400 hover:bg-blue-500';
                if (seat.status === 'accessible') bgClass = 'bg-purple-600 border-purple-400 hover:bg-purple-500';
                if (seat.status === 'reserved') bgClass = 'bg-amber-500 border-amber-400 cursor-not-allowed';
                if (seat.status === 'booked') bgClass = 'bg-red-500 border-red-400 cursor-not-allowed';
                
                if (isSelected) {
                  bgClass = 'bg-brand-cyan border-white ring-2 ring-white scale-110 animate-bounce';
                }

                const isUnavailable = seat.status === 'booked' || seat.status === 'reserved';
                return (
                  <div
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSeatClick(seat);
                      }
                    }}
                    role="button"
                    tabIndex={isUnavailable ? -1 : 0}
                    aria-pressed={isSelected}
                    aria-disabled={isUnavailable}
                    aria-label={`Row ${seat.row}, Seat ${seat.number}, $${seat.price}, ${seat.status}${isSelected ? ', selected' : ''}`}
                    title={`Row ${seat.row}, Seat ${seat.number} - $${seat.price}`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${bgClass}`}
                  >
                    {seat.row}-{seat.number}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Smart Seat Finder (Filters) */}
        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-cyan" /> {t('seat.finder')}
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setBudgetFilter(!budgetFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-200 ${budgetFilter ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              {t('seat.budget')} (&le; $250)
            </button>
            <button
              onClick={() => setVipFilter(!vipFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-200 ${vipFilter ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              {t('seat.premium')}
            </button>
            <button
              onClick={() => setAccessibleFilter(!accessibleFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-200 ${accessibleFilter ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              {t('seat.wheelchair')}
            </button>
            <button
              onClick={() => setFamilyFilter(!familyFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-200 ${familyFilter ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              {t('seat.family')}
            </button>
            <button
              onClick={() => setExitFilter(!exitFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-200 ${exitFilter ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              {t('seat.exitDist')}
            </button>
            <button
              onClick={() => setFoodFilter(!foodFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition duration-200 ${foodFilter ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
            >
              {t('seat.foodDist')}
            </button>
          </div>
        </div>
      </div>

      {/* AI recommendation & seat comparison sidebar */}
      <div className="flex flex-col gap-6">
        {/* Section Select card */}
        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-white mb-4">Choose Stadium Section</h4>
          <div className="grid grid-cols-4 gap-2">
            {['104', '106', '110', '220'].map((sec) => (
              <button
                key={sec}
                onClick={() => { setSelectedSection(sec); setSelectedSeats([]); }}
                className={`py-3.5 rounded-xl font-bold text-sm transition border ${selectedSection === sec ? 'bg-gradient-to-r from-brand-cyan to-brand-purple border-brand-cyan text-white shadow-glow' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="glass-card p-6 relative overflow-hidden flex-grow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
            {t('seat.aiRecommend')}
          </h4>
          <p className="text-xs text-slate-400 mb-6">Compare optimized configurations compiled by FIFA neural engine.</p>

          <div className="flex flex-col gap-4">
            {/* View rec */}
            <div
              onClick={() => selectRecommendation('view')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectRecommendation('view');
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={aiSelection === 'view'}
              aria-label={`Select recommendation: ${aiRecommendations.view.name}, $${aiRecommendations.view.price}`}
              className={`p-4 rounded-xl border cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-brand-cyan ${aiSelection === 'view' ? 'bg-brand-cyan/15 border-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-white">{aiRecommendations.view.name}</span>
                <span className="text-brand-cyan text-xs font-bold">${aiRecommendations.view.price}</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{aiRecommendations.view.desc}</p>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>View Rating: {aiRecommendations.view.rating}</span>
                <span>Exit: {aiRecommendations.view.exitDistance}</span>
              </div>
            </div>

            {/* Budget rec */}
            <div
              onClick={() => selectRecommendation('budget')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectRecommendation('budget');
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={aiSelection === 'budget'}
              aria-label={`Select recommendation: ${aiRecommendations.budget.name}, $${aiRecommendations.budget.price}`}
              className={`p-4 rounded-xl border cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-brand-cyan ${aiSelection === 'budget' ? 'bg-brand-cyan/15 border-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-white">{aiRecommendations.budget.name}</span>
                <span className="text-brand-cyan text-xs font-bold">${aiRecommendations.budget.price}</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{aiRecommendations.budget.desc}</p>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>View Rating: {aiRecommendations.budget.rating}</span>
                <span>Exit: {aiRecommendations.budget.exitDistance}</span>
              </div>
            </div>

            {/* Exit rec */}
            <div
              onClick={() => selectRecommendation('exit')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectRecommendation('exit');
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={aiSelection === 'exit'}
              aria-label={`Select recommendation: ${aiRecommendations.exit.name}, $${aiRecommendations.exit.price}`}
              className={`p-4 rounded-xl border cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-brand-cyan ${aiSelection === 'exit' ? 'bg-brand-cyan/15 border-brand-cyan shadow-glow' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-white">{aiRecommendations.exit.name}</span>
                <span className="text-brand-cyan text-xs font-bold">${aiRecommendations.exit.price}</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{aiRecommendations.exit.desc}</p>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>View: {aiRecommendations.exit.rating}</span>
                <span>Exit Proximity: {aiRecommendations.exit.exitDistance}</span>
              </div>
            </div>
          </div>

          {/* AI Comparison matrix toggle */}
          <button
            onClick={() => setAiCompareActive(!aiCompareActive)}
            className="w-full text-xs font-bold text-brand-cyan hover:underline mt-4 text-center block"
          >
            {aiCompareActive ? '✕ Hide Comparison Details' : '📊 Compare Recommendations Side-by-Side'}
          </button>

          {aiCompareActive && (
            <div className="mt-4 p-3 bg-slate-900 border border-white/5 rounded-xl text-[11px] flex flex-col gap-2">
              <div className="grid grid-cols-4 font-bold text-slate-400 border-b border-white/5 pb-1">
                <span>Metric</span>
                <span>Best View</span>
                <span>Budget</span>
                <span>Fast Exit</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-300">Price</span>
                <span className="text-brand-cyan">$450</span>
                <span className="text-brand-cyan">$250</span>
                <span className="text-brand-cyan">$225</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-300">View</span>
                <span>Excellent</span>
                <span>Good</span>
                <span>Fair</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-300">Exit Proximity</span>
                <span>Medium</span>
                <span>Close</span>
                <span>Immediate</span>
              </div>
              <div className="grid grid-cols-4">
                <span className="font-semibold text-slate-300">Crowd Level</span>
                <span>Low</span>
                <span>Medium</span>
                <span>Lowest</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Summary / Checkout */}
        <div className="glass-card p-6 bg-brand-card/90">
          <h4 className="text-sm font-bold text-white mb-4">Reservation Summary</h4>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">Selected seats:</span>
            <span className="font-bold text-white">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span>
          </div>
          <div className="flex justify-between text-xs mb-4">
            <span className="text-slate-400">Price Subtotal:</span>
            <span className="font-bold text-brand-cyan">${getSelectedPrice()}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-white/5 pt-3 mb-6">
            <span>{t('seat.total')}:</span>
            <span className="text-brand-cyan text-lg">${getSelectedPrice()}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-3 rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedSeats.length === 0}
              className="flex-1 bg-gradient-to-r from-brand-cyan to-brand-purple disabled:opacity-50 py-3 rounded-lg font-bold text-xs text-white shadow-glow hover:scale-[1.01] transition"
            >
              {t('seat.proceed')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
