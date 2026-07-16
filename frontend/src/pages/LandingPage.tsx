import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES_LIST } from '../context/LanguageContext';
import { Compass, Globe } from 'lucide-react';

interface LandingPageProps {
  onLoginSuccess: (role: 'customer' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Form mode instead of Modals: 'login' | 'register' | 'forgot' | 'reset' | 'admin'
  const [formMode, setFormMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'admin'>('login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formErr, setFormErr] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    try {
      await login(username, password, 'customer');
      onLoginSuccess('customer');
    } catch (err: any) {
      setFormErr(err.message || 'Login failed.');
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    try {
      await login(adminUsername, password, 'admin');
      onLoginSuccess('admin');
    } catch (err: any) {
      setFormErr(err.message || 'Admin authorization failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    try {
      await register(username, name, password);
      onLoginSuccess('customer');
    } catch (err: any) {
      setFormErr(err.message || 'Registration failed.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Reset code sent. Please check your inbox.');
    setTimeout(() => {
      setFormMode('reset');
      setSuccessMsg('');
    }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Password updated successfully. You can now login.');
    setTimeout(() => {
      setFormMode('login');
      setSuccessMsg('');
    }, 1500);
  };

  return (
    <div className="bg-surface text-on-surface font-sans antialiased min-h-screen flex flex-col">
      {/* BEGIN: Top Header Bar */}
      <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-sm sticky top-0 z-40 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-md">stadium</span>
            </div>
            <div>
              <h1 className="font-bold text-on-surface text-lg leading-none">NexArena</h1>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">Stadium Management</span>
            </div>
          </div>
          
          {/* Live Score Bubble */}
          <div className="bg-surface-container-high border border-primary/30 rounded-full px-4 py-1.5 flex items-center gap-3 text-sm shadow-sm ml-4">
            <span className="text-on-surface font-bold">ARG</span>
            <span className="text-primary font-black">2 - 2</span>
            <span className="text-on-surface font-bold">FRA</span>
            <span className="text-on-surface-variant text-xs">82'</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-widest leading-none">Stadium Occupancy</p>
              <p className="text-primary font-bold">94%</p>
            </div>
            <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-widest leading-none">Arena Weather</p>
                <p className="text-on-surface font-bold">28°C Clear</p>
              </div>
              <span className="material-symbols-outlined text-tertiary">wb_sunny</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-sm hover:border-primary transition-colors cursor-pointer">
            <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              aria-label="Select display language"
              className="bg-transparent text-xs font-bold text-on-surface border-none outline-none cursor-pointer"
            >
              {LANGUAGES_LIST.map((l) => (
                <option key={l.code} value={l.code} className="bg-surface-container text-on-surface">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      {/* END: Top Header Bar */}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen p-10">
        {/* BEGIN: Hero Section */}
        <section className="mb-16 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <span className="material-symbols-outlined text-primary text-sm">stars</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary">FIFA World Cup 2026 Official Management Portal</span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-black text-on-surface leading-[1.1] mb-8 text-gradient">
            Experience the Future of<br />Stadium Navigation &amp; Planning
          </h2>
          
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            Integrated with four active AI components to orchestrate crowd flows, deliver instant multi-tongue translations, forecast traffic buffers, and coordinate security.
          </p>

          {/* Interactive Authentication Panel Card */}
          <div className="max-w-md mx-auto bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-sm text-left">
            
            {/* Header info based on mode */}
            {formMode === 'login' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-on-surface mb-2">Welcome to NexArena</h3>
                <p className="text-sm text-on-surface-variant">Please sign in to access your personalized match day experience.</p>
              </div>
            )}
            {formMode === 'register' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-on-surface mb-2">Create an Account</h3>
                <p className="text-sm text-on-surface-variant">Sign up to get personalized AI scheduling and ticket booking.</p>
              </div>
            )}
            {formMode === 'admin' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-on-surface mb-2">Access Mission Control</h3>
                <p className="text-sm text-on-surface-variant">Secure dashboard for FIFA staff, safety broadcasts, and security nodes.</p>
              </div>
            )}
            {formMode === 'forgot' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-on-surface mb-2">Reset Request</h3>
                <p className="text-sm text-on-surface-variant">Retrieve access to your NexArena account settings.</p>
              </div>
            )}
            {formMode === 'reset' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-on-surface mb-2">New Credentials</h3>
                <p className="text-sm text-on-surface-variant">Please enter the security verification code and set your new password.</p>
              </div>
            )}

            {formErr && (
              <div className="mb-4 bg-error-container border border-error/30 text-error text-xs px-4 py-3 rounded-xl font-semibold">
                {formErr}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-3 rounded-xl font-semibold animate-pulse">
                {successMsg}
              </div>
            )}

            {/* Render Forms */}
            {formMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-username-1">Username</label>
                  <input id="landingpage-username-1"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="Enter username (e.g. fan1)"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-password-2">Password</label>
                  <input id="landingpage-password-2"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input className="rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                    <span className="text-on-surface-variant">Remember me</span>
                  </label>
                  <button type="button" onClick={() => { setFormMode('forgot'); setFormErr(''); }} className="text-primary font-bold hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <button
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
                  type="submit"
                >
                  Sign In to Fan Portal <span className="material-symbols-outlined text-sm">login</span>
                </button>
                <button
                  onClick={() => { setFormMode('register'); setFormErr(''); }}
                  className="w-full py-4 mt-2 border border-outline-variant bg-surface-container-lowest text-primary rounded-2xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  Create an account <span className="material-symbols-outlined text-sm">person_add</span>
                </button>
              </form>
            )}

            {formMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-full-name-3">Full Name</label>
                  <input id="landingpage-full-name-3"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="e.g. Lionel Fan"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-username-4">Username</label>
                  <input id="landingpage-username-4"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="e.g. fan2"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-password-5">Password</label>
                  <input id="landingpage-password-5"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="Create Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
                  type="submit"
                >
                  Create Account & Sign In <span className="material-symbols-outlined text-sm">how_to_reg</span>
                </button>
                <button
                  onClick={() => { setFormMode('login'); setFormErr(''); }}
                  className="w-full py-3 mt-2 border border-outline-variant bg-surface-container-lowest text-primary rounded-2xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  Back to Log In
                </button>
              </form>
            )}

            {formMode === 'admin' && (
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-admin-username-6">Admin Username</label>
                  <input id="landingpage-admin-username-6"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="Enter admin username (e.g. admin1)"
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-secret-access-password-7">Secret Access Password</label>
                  <input id="landingpage-secret-access-password-7"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
                  type="submit"
                >
                  Authorize Mission Control <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                </button>
                <button
                  onClick={() => { setFormMode('login'); setFormErr(''); }}
                  className="w-full py-3 mt-2 border border-outline-variant bg-surface-container-lowest text-primary rounded-2xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  Access Customer Fan Portal
                </button>
              </form>
            )}

            {formMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter your registered username and we will generate a mock security verification code to update your credentials.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-username-8">Username</label>
                  <input id="landingpage-username-8"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="Username"
                    type="text"
                    required
                  />
                </div>
                <button
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
                  type="submit"
                >
                  Generate Reset Token
                </button>
                <button
                  onClick={() => { setFormMode('login'); setFormErr(''); }}
                  className="w-full py-3 border border-outline-variant bg-surface-container-lowest text-primary rounded-2xl font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {formMode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-verification-token-9">Verification Token</label>
                  <input id="landingpage-verification-token-9"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="Check your mock email"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="landingpage-new-password-10">New Password</label>
                  <input id="landingpage-new-password-10"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-primary text-body-md transition-all outline-none"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
                  type="submit"
                >
                  Update &amp; Authenticate
                </button>
              </form>
            )}

            {/* Quick Staff Access toggle */}
            {formMode === 'login' && (
              <div className="mt-8 pt-6 border-t border-outline-variant text-center">
                <p className="text-xs text-on-surface-variant mb-4 uppercase tracking-widest font-bold">Staff &amp; Management</p>
                <button
                  onClick={() => { setFormMode('admin'); setFormErr(''); }}
                  className="w-full py-3 bg-surface-container-highest border border-outline-variant rounded-xl font-bold text-sm text-on-surface hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
                >
                  Access Mission Control <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                </button>
              </div>
            )}
          </div>
        </section>
        {/* END: Hero Section */}

        {/* BEGIN: Main Dashboard Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
          {/* LEFT COL: Upcoming Matches */}
          <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-widest text-on-surface">Upcoming Matches</h3>
              <button onClick={() => { setFormMode('login'); alert('Please sign in to access the schedule finder.'); }} className="text-primary text-sm font-bold hover:underline">
                View All Schedule
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Match Card 1 */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold text-primary uppercase">Match Day ID: M1</span>
                  <span className="text-on-surface font-black">$250</span>
                </div>
                <div className="flex items-center gap-6 mb-8 justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-lg font-bold mb-2">AR</div>
                    <p className="text-xs text-on-surface-variant">Argentina</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-on-surface mb-1">vs</p>
                    <div className="h-px bg-outline-variant w-full"></div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-lg font-bold mb-2">FR</div>
                    <p className="text-xs text-on-surface-variant">France</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  MetLife Stadium (New York)
                </div>
              </div>

              {/* Match Card 2 */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold text-primary uppercase">Match Day ID: M2</span>
                  <span className="text-on-surface font-black">$280</span>
                </div>
                <div className="flex items-center gap-6 mb-8 justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-lg font-bold mb-2">BR</div>
                    <p className="text-xs text-on-surface-variant">Brazil</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-on-surface mb-1">vs</p>
                    <div className="h-px bg-outline-variant w-full"></div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-lg font-bold mb-2">DE</div>
                    <p className="text-xs text-on-surface-variant">Germany</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  SoFi Stadium (Los Angeles)
                </div>
              </div>
            </div>

            {/* AI Suggestion Box */}
            <div className="bg-primary-container/10 border border-primary/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px]"></div>
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-on-surface mb-2 uppercase tracking-wide">Personalized AI Suggestions</h4>
                  <p className="text-on-surface-variant mb-6 max-w-2xl">
                    AI analysis shows heavy traffic forecasted around MetLife South exits post 20:00. Enter your ticket gate to pre-calculate crowd routing.
                  </p>
                  <button onClick={() => { setFormMode('login'); alert('Please sign in to access the AI planning tools.'); }} className="px-6 py-2 border border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary hover:text-on-primary transition-all">
                    Launch AI Planner
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COL: Announcements */}
          <div className="space-y-8">
            <h3 className="text-xl font-black uppercase tracking-widest text-on-surface">Latest Announcements</h3>
            <div className="space-y-4">
              {/* Alert Card */}
              <div className="bg-surface-container-low border border-error/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-error uppercase">Weather</span>
                  <div className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded border border-error/20">APPROVED ALERT</div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
                  [Safety Announcement] Notice regarding WEATHER: fire. Please remain calm.
                </p>
                <p className="text-[10px] text-on-surface-variant uppercase font-mono">2 mins ago</p>
              </div>

              {/* General Card */}
              <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-primary uppercase">Security</span>
                  <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20">INFO</div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-2">
                  Enhanced biometric checkpoints active at Gate C and Gate F for faster entry.
                </p>
                <p className="text-[10px] text-on-surface-variant uppercase font-mono">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
        {/* END: Main Dashboard Content */}
      </main>

      {/* Footer HUD */}
      <footer className="w-full py-8 border-t border-outline-variant text-center text-xs text-on-surface-variant mt-auto bg-surface-container-low">
        <p>© FIFA World Cup 2026 • Powered by NexArena. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-primary/60 font-mono">Demo credentials: fan1 (fanpass) / admin1 (adminpass)</p>
      </footer>
    </div>
  );
};
