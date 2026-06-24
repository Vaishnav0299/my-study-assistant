import React, { createContext, useContext, useState, useEffect } from 'react';

const StudyContext = createContext();

export function StudyProvider({ children }) {
  const [persona, setPersona] = useState("✨ Friendly Guide");
  const [isDark, setIsDark] = useState(true);
  const [stats, setStats] = useState({
    questionsAsked: 0,
    topicsLearned: 0
  });
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");

  const [sessions, setSessions] = useState([
    {
      id: "default-session",
      title: "New Chat Session",
      history: [],
      timestamp: Date.now()
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState("default-session");

  // Load from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('study_stats_advanced');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    const savedTheme = localStorage.getItem('study_theme_advanced');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
    const savedModel = localStorage.getItem('study_model_advanced');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    const savedSessions = localStorage.getItem('study_sessions_advanced');
    const savedActiveId = localStorage.getItem('study_active_session_id');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed.length > 0) {
          setSessions(parsed);
          if (savedActiveId && parsed.some(s => s.id === savedActiveId)) {
            setActiveSessionId(savedActiveId);
          } else {
            setActiveSessionId(parsed[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('study_stats_advanced', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('study_theme_advanced', isDark.toString());
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('study_sessions_advanced', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('study_active_session_id', activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    localStorage.setItem('study_model_advanced', selectedModel);
  }, [selectedModel]);

  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Session ${sessions.length + 1}`,
      history: [],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const updateActiveSessionHistory = (newHistory) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        // Derive title from first user message if title is default
        let updatedTitle = s.title;
        if (s.title.startsWith("Session") || s.title === "New Chat Session") {
          const firstUserMsg = newHistory.find(m => m.role === 'user');
          if (firstUserMsg) {
            updatedTitle = firstUserMsg.content.slice(0, 24) + (firstUserMsg.content.length > 24 ? '...' : '');
          }
        }
        return { ...s, history: newHistory, title: updatedTitle };
      }
      return s;
    }));
  };

  const deleteSession = (id) => {
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      // Re-create a default one if all are deleted
      const defaultId = "default-session";
      setSessions([
        {
          id: defaultId,
          title: "New Chat Session",
          history: [],
          timestamp: Date.now()
        }
      ]);
      setActiveSessionId(defaultId);
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  const clearAllSessions = () => {
    if (window.confirm("Are you sure you want to clear all chat history and sessions?")) {
      const defaultId = "default-session";
      setSessions([
        {
          id: defaultId,
          title: "New Chat Session",
          history: [],
          timestamp: Date.now()
        }
      ]);
      setActiveSessionId(defaultId);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const resetStats = () => {
    setStats({ questionsAsked: 0, topicsLearned: 0 });
  };

  return (
    <StudyContext.Provider value={{
      persona,
      setPersona,
      isDark,
      setIsDark,
      stats,
      setStats,
      resetStats,
      sessions,
      activeSessionId,
      activeSession,
      setActiveSessionId,
      createNewSession,
      updateActiveSessionHistory,
      deleteSession,
      clearAllSessions,
      selectedModel,
      setSelectedModel
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
}
