import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LandingPage } from './pages/LandingPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Compass } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Local state to track current screen
  // If user log in, it will load dashboard matching their role
  const [screen, setScreen] = useState<'landing' | 'customer' | 'admin'>('landing');

  // Sync screen with auth state
  React.useEffect(() => {
    if (user) {
      if (user.role === 'primary_admin' || user.role === 'secondary_admin') {
        setScreen('admin');
      } else {
        setScreen('customer');
      }
    } else {
      setScreen('landing');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-brand-dark flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center shadow-glow animate-spin">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold tracking-wider text-slate-400">Loading NexArena Services...</p>
      </div>
    );
  }

  // Role Safety Routing protection
  if (screen === 'admin' && (user?.role === 'primary_admin' || user?.role === 'secondary_admin')) {
    return <AdminDashboard />;
  }


  if (screen === 'customer' && user?.role === 'customer') {
    return <CustomerDashboard />;
  }

  return <LandingPage onLoginSuccess={(role) => setScreen(role)} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
