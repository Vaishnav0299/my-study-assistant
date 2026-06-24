import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import logoImg from '../logo.png';
import { 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Calendar,
  Activity,
  Sun, 
  Moon, 
  Plus, 
  Trash2,
  Menu,
  X
} from 'lucide-react';

const PERSONALITIES = {
  "✨ Friendly Guide": "Breaks down concepts using simple terms and motivational check-ins.",
  "🎓 Academic Professor": "Structures responses with headers, list points, and precise terminology.",
  "🤔 Socratic Tutor": "Guides you to answers via hints and thought-provoking questions."
};

export default function Layout() {
  const { 
    persona, 
    setPersona, 
    isDark, 
    setIsDark, 
    stats, 
    resetStats, 
    sessions, 
    activeSessionId, 
    setActiveSessionId, 
    createNewSession, 
    deleteSession,
    clearAllSessions,
    selectedModel,
    setSelectedModel
  } = useStudy();

  const [isConnected, setIsConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check connection with backend env key
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setIsConnected(data.connected);
      } catch (e) {
        setIsConnected(false);
      }
    };
    checkConnection();
    // Poll connection status every 15 seconds
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard & Chat', icon: MessageSquare },
    { to: '/quiz', label: 'Quiz Generator', icon: HelpCircle },
    { to: '/docs', label: 'My Documents', icon: FileText },
    { to: '/plans', label: 'Study Plans', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 dark:bg-gradient-to-tr dark:from-zinc-950 dark:via-slate-950 dark:to-indigo-950/20 text-zinc-900 dark:text-zinc-50 flex flex-col transition-colors duration-200">
      
      {/* Header Panel */}
      <header className="sticky top-0 z-35 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 text-zinc-500"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 flex items-center justify-center bg-zinc-950 border border-zinc-200/10">
              <img src={logoImg} alt="Neural Nexus Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight tracking-tight font-sans">Neural Nexus</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">Premium AI-Powered Learning Companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{isConnected ? 'Neural Network Online' : 'Local API Mode'}</span>
            </div>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 dark:text-zinc-400"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        
        {/* Left Column - Sidebar (Hidden on mobile unless active) */}
        <aside className={`lg:col-span-1 space-y-6 lg:block ${mobileMenuOpen ? 'absolute top-0 left-6 right-6 z-40 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 block shadow-xl' : 'hidden'}`}>
          
          {/* Navigation Menu */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" /> Navigation
            </h3>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink 
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => 
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`
                    }
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Chat Sessions */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center">
                💬 Chat History
              </h3>
              <button 
                onClick={createNewSession}
                className="p-1 rounded-md bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 hover:scale-105 transition-all"
                title="New Chat"
                aria-label="Create New Chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {sessions.map((session) => {
                const active = session.id === activeSessionId;
                return (
                  <div 
                    key={session.id} 
                    className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${
                      active 
                        ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
                        : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/40 text-zinc-650 dark:text-zinc-350'
                    }`}
                  >
                    <button 
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 text-left truncate font-medium mr-2"
                    >
                      {session.title}
                    </button>
                    <button 
                      onClick={() => deleteSession(session.id)}
                      className="opacity-0 group-hover:opacity-150 hover:text-rose-500 transition-all p-0.5 rounded-md"
                      title="Delete Session"
                      aria-label={`Delete ${session.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Learning Stats */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center">
                <Activity className="h-4 w-4 mr-2" /> Today's Stats
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Questions Asked</span>
                <span className="font-semibold text-xs">{stats.questionsAsked}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Topics Learned</span>
                <span className="font-semibold text-xs">{stats.topicsLearned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Study Time</span>
                <span className="font-semibold text-xs text-indigo-500">{(stats.questionsAsked * 0.1).toFixed(1)} hrs</span>
              </div>
            </div>
          </div>

          {/* Study Settings */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              ⚙️ Study Settings
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-450">Assistant Personality</label>
              <div className="space-y-1.5">
                {Object.keys(PERSONALITIES).map((pKey) => {
                  const pDesc = PERSONALITIES[pKey];
                  const active = persona === pKey;
                  return (
                    <button
                      key={pKey}
                      onClick={() => setPersona(pKey)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col space-y-1 ${
                        active 
                          ? 'border-indigo-500/80 bg-indigo-500/5 dark:bg-indigo-500/10' 
                          : 'border-zinc-200 dark:border-zinc-800/80 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                      }`}
                      aria-label={`Select personality ${pKey}`}
                    >
                      <span className={`font-semibold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-300'}`}>
                        {pKey}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                        {pDesc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/40">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-455">Neural Network Model</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'gemini-2.5-flash', label: '⚡ Quick', desc: 'Fast Responses' },
                  { id: 'gemini-2.5-pro', label: '🧠 Thinking', desc: 'Deep Reasoning' }
                ].map((m) => {
                  const active = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2 rounded-xl border text-[11px] transition-all flex flex-col items-center justify-center text-center ${
                        active 
                          ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10' 
                          : 'border-zinc-200 dark:border-zinc-800/80 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                      }`}
                      aria-label={`Select model ${m.label}`}
                    >
                      <span className={`font-semibold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-300'}`}>
                        {m.label}
                      </span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-550">
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Credits */}
          <div className="text-center pt-2 pb-1 border-t border-zinc-200/50 dark:border-zinc-800/40">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Designed & Developed by Vaishnav Gaware
            </p>
          </div>
        </aside>

        {/* Right Column - Main view (Scale 3/4) */}
        <div className="lg:col-span-3 min-h-[600px] flex flex-col">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
