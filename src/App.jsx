import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  HelpCircle, 
  BookOpen, 
  Plus, 
  Trash2, 
  Send, 
  Paperclip, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  FileText,
  X,
  RefreshCw
} from 'lucide-react';

const PERSONALITIES = {
  "✨ Friendly Guide": {
    emoji: "✨",
    desc: "Breaks down concepts using simple terms, analogies, and motivational check-ins.",
    prompt: "You are a friendly, enthusiastic, and highly encouraging Study Assistant. Break down complex concepts into simple, beginner-friendly explanations. Use clear analogies and relatable real-world examples. Always ask an engaging follow-up question."
  },
  "🎓 Academic Professor": {
    emoji: "🎓",
    desc: "Rigorous, detailed, and professional. Structures responses with headers and precise terminology.",
    prompt: "You are a strictly academic, highly detailed, and professional university Professor. Use precise, formal terminology, cite key concepts, and structure your responses with clean Markdown headers and bullet points. Always ask a deep, analytical follow-up question."
  },
  "🤔 Socratic Tutor": {
    emoji: "🤔",
    desc: "Does not give direct answers. Guides you to the answer via helpful hints and questions.",
    prompt: "You are a Socratic Tutor. You do NOT give direct answers to questions. Instead, you guide the student to the answer themselves by asking helpful, thought-provoking questions, providing gentle hints, and breaking down the problem into smaller parts. Keep responses short and interactive."
  }
};

const QUICK_ACTIONS = [
  { label: "📘 Summarize Notes", prompt: "Summarize my notes on the following topic and list key terms: " },
  { label: "🧠 Quiz Me", prompt: "Quiz me on this topic by asking me 3 conceptual questions: " },
  { label: "📝 Generate MCQs", prompt: "Generate 3 multiple choice questions (MCQs) to test my knowledge on: " },
  { label: "📊 Explain Concepts", prompt: "Break down the core concepts of this topic using a Socratic teaching style: " }
];

export default function App() {
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [persona, setPersona] = useState("✨ Friendly Guide");
  const [customKey, setCustomKey] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // File upload state
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileContent, setAttachedFileContent] = useState('');
  
  // Stats state
  const [stats, setStats] = useState({
    questionsAsked: 0,
    topicsLearned: 0
  });

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize and load stats/theme from local storage
  useEffect(() => {
    const savedStats = localStorage.getItem('study_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    const savedTheme = localStorage.getItem('study_theme');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
    
    // Check initial API key connection
    checkConnectionStatus();
  }, []);

  // Update theme on HTML tag
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('study_theme', isDark.toString());
  }, [isDark]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const checkConnectionStatus = async (key = '') => {
    try {
      const response = await fetch(`/api/status?custom_key=${encodeURIComponent(key)}`);
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (e) {
      setIsConnected(false);
    }
  };

  const handleKeyChange = (e) => {
    const val = e.target.value;
    setCustomKey(val);
    checkConnectionStatus(val);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = /(\.txt|\.md|\.py|\.json|\.csv)$/i;
    if (!allowedExtensions.exec(file.name)) {
      alert("Only text files (.txt, .md, .py, .json, .csv) are supported in this assistant.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile(file);
      setAttachedFileContent(event.target.result);
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsText(file);
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setAttachedFileContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !attachedFile) return;

    let fullQueryMessage = message;
    if (attachedFileContent) {
      const previewContent = attachedFileContent.substring(0, 5000);
      fullQueryMessage += `\n\n[Uploaded Notes / File Content (${attachedFile.name}):\n${previewContent}]`;
    }

    const newUserMessage = {
      role: 'user',
      content: message + (attachedFile ? ` 📎 (${attachedFile.name})` : '')
    };

    setHistory(prev => [...prev, newUserMessage]);
    setMessage('');
    removeAttachedFile();
    setLoading(true);

    // Update stats
    const updatedStats = {
      questionsAsked: stats.questionsAsked + 1,
      topicsLearned: stats.topicsLearned + (message.trim().length > 15 ? 1 : 0)
    };
    setStats(updatedStats);
    localStorage.setItem('study_stats', JSON.stringify(updatedStats));

    try {
      // Map history list for payload
      const formattedHistory = [];
      let tempUserMsg = null;
      
      for (const msg of history) {
        if (msg.role === 'user') {
          tempUserMsg = msg.content;
        } else if (msg.role === 'model' && tempUserMsg !== null) {
          formattedHistory.push([tempUserMsg, msg.content]);
          tempUserMsg = null;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullQueryMessage,
          history: formattedHistory,
          persona: persona,
          custom_key: customKey
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setHistory(prev => [...prev, { role: 'model', content: data.response }]);
      } else {
        setHistory(prev => [...prev, { role: 'model', content: `⚠️ Error: ${data.detail || 'Failed to generate response'}` }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'model', content: `⚠️ Connection Error: Failed to contact the backend server.` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (promptPrefix) => {
    setMessage(promptPrefix);
  };

  const clearChat = () => {
    setHistory([]);
    setMessage('');
    removeAttachedFile();
  };

  const resetStats = () => {
    const initialStats = { questionsAsked: 0, topicsLearned: 0 };
    setStats(initialStats);
    localStorage.setItem('study_stats', JSON.stringify(initialStats));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 dark:bg-gradient-to-tr dark:from-zinc-950 dark:via-slate-950 dark:to-indigo-950/20 text-zinc-900 dark:text-zinc-50 flex flex-col transition-colors duration-200">
      
      {/* Header Panel */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight tracking-tight font-sans">StudySphere AI</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Premium AI-Powered Learning Companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection status tag */}
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{isConnected ? 'Gemini Connected' : 'Local API Mode'}</span>
            </div>

            {/* Theme toggle button */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 dark:text-zinc-400"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - Sidebar (Scale 1/4) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Platform Menu */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" /> Platform Menu
            </h3>
            <nav className="space-y-1">
              <a href="#" className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium text-sm transition-all">
                <span>🏠 Dashboard & Chat</span>
              </a>
              <a href="#" onClick={() => alert("Quiz Generator is standard in this plan. Prompt the AI directly to generate quizzes!")} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm transition-all">
                <span>🧠 Quiz Generator</span>
              </a>
              <a href="#" onClick={() => alert("Use the attachment pin button below to parse document notes.")} className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm transition-all">
                <span>📄 My Documents</span>
              </a>
            </nav>
          </div>

          {/* Today's Learning Stats */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center">
                <Activity className="h-4 w-4 mr-2" /> Today's Stats
              </h3>
              <button 
                onClick={resetStats}
                className="text-[10px] text-zinc-400 hover:text-rose-500 font-medium transition-all"
                title="Reset Stats"
              >
                Reset
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-455">Questions Asked</span>
                <span className="font-semibold text-sm">{stats.questionsAsked}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-455">Topics Learned</span>
                <span className="font-semibold text-sm">{stats.topicsLearned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-455">Study Time</span>
                <span className="font-semibold text-sm text-indigo-500">{(stats.questionsAsked * 0.1).toFixed(1)} hrs</span>
              </div>
            </div>
          </div>

          {/* Study Settings */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center">
              ⚙️ Study Settings
            </h3>
            
            {/* Personality Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Assistant Personality</label>
              <div className="space-y-1.5">
                {Object.keys(PERSONALITIES).map((pKey) => {
                  const pData = PERSONALITIES[pKey];
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
                    >
                      <span className={`font-semibold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-250'}`}>
                        {pKey}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                        {pData.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key Accordion */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">🔑 Custom API Key (Optional)</label>
              <input
                type="password"
                placeholder="Enter Gemini API Key..."
                value={customKey}
                onChange={handleKeyChange}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
              />
            </div>

          </div>
        </div>

        {/* Right Column - Chat Space (Scale 3/4) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)] min-h-[600px]">
          
          <div className="border-b border-zinc-200/60 dark:border-zinc-850 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center space-x-2 text-zinc-800 dark:text-zinc-200">
              <span>💬 Study Space</span>
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">|</span>
              <span className="text-xs font-medium text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded-md">
                {persona} Mode
              </span>
            </h3>
            
            <button 
              onClick={clearChat}
              disabled={history.length === 0}
              className="text-xs text-zinc-500 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-zinc-500 flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Session</span>
            </button>
          </div>

          {/* Chat / Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {history.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-12 px-4 space-y-6">
                <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-150">Welcome to StudySphere AI</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Your premium study companion. Ask questions, generate concept summaries, take quizzes, or attach files to learn faster.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 text-left max-w-lg mx-auto">
                  <h4 className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">💡 How to start:</h4>
                  <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-350">
                    <li className="flex items-start space-x-2">
                      <span className="text-indigo-500 font-bold">1.</span>
                      <span>Select an <b>Assistant Personality</b> in the sidebar to customize explanations.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-indigo-500 font-bold">2.</span>
                      <span>Type a prompt, attach a coding/text file, or click a <b>Quick Action</b> card below.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-indigo-500 font-bold">3.</span>
                      <span>Ask follow-up questions to drill down into difficult topics.</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {history.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm leading-relaxed border ${
                        isUser 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/5' 
                          : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200'
                      }`}>
                        {/* Render simple formatting */}
                        <div className="whitespace-pre-wrap font-sans">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl px-5 py-3.5 flex items-center space-x-3 text-xs text-zinc-400">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                      <span>Gemini is composing explanations...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          {history.length === 0 && (
            <div className="px-6 py-2 border-t border-zinc-100 dark:border-zinc-800/40">
              <div className="max-w-4xl mx-auto">
                <h4 className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-550 uppercase tracking-widest mb-2">⚡ Quick Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="p-3 text-left bg-zinc-50 hover:bg-indigo-50/40 dark:bg-zinc-900/30 dark:hover:bg-indigo-950/20 border border-zinc-200/55 dark:border-zinc-800/80 rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">
                        {action.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-normal block">
                        Autofills matching prompt
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-6 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/10">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto space-y-3">
              
              {/* Attached file indicator */}
              {attachedFile && (
                <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs w-fit">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  <span className="font-medium truncate max-w-[180px]">{attachedFile.name}</span>
                  <button 
                    type="button" 
                    onClick={removeAttachedFile}
                    className="hover:bg-indigo-500/20 p-0.5 rounded-full transition-all ml-1.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex items-end space-x-3">
                {/* Text prompt text area */}
                <div className="flex-1 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 flex items-end space-x-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                  <textarea
                    rows="2"
                    placeholder="Ask a question or enter a topic... (e.g. Explain Bayes' theorem with an analogy)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    className="flex-1 text-sm bg-transparent border-0 outline-none focus:ring-0 resize-none px-2 text-zinc-850 dark:text-zinc-100"
                  />
                  
                  {/* File attach button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-zinc-450 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    title="Attach Code / Notes File"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.md,.py,.json,.csv"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!message.trim() && !attachedFile}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>

    </div>
  );
}
