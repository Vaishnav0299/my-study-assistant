import React, { useState, useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Trash2, 
  RefreshCw, 
  HelpCircle,
  Keyboard,
  ArrowRight,
  Sparkles,
  Activity
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: "📘 Summarize Notes", prompt: "Summarize my notes on the following topic and list key terms: " },
  { label: "🧠 Quiz Me", prompt: "Quiz me on this topic by asking me 3 conceptual questions: " },
  { label: "📝 Generate MCQs", prompt: "Generate 3 multiple choice questions (MCQs) to test my knowledge on: " },
  { label: "📊 Explain Concepts", prompt: "Break down the core concepts of this topic using a Socratic teaching style: " }
];

export default function ChatPage() {
  const { 
    persona, 
    activeSession, 
    updateActiveSessionHistory, 
    stats, 
    setStats,
    selectedModel
  } = useStudy();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [stagedDoc, setStagedDoc] = useState(null);
  const [requestTimestamps, setRequestTimestamps] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.history, loading]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus input with "/" key if no text fields are focused
      if (e.key === '/' && document.activeElement !== inputRef.current && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load any document staged from DocsPage
  useEffect(() => {
    const docData = localStorage.getItem('staged_document_to_chat');
    if (docData) {
      try {
        const parsed = JSON.parse(docData);
        setStagedDoc(parsed);
        localStorage.removeItem('staged_document_to_chat');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() && !stagedDoc) return;

    let fullQueryMessage = message;
    if (stagedDoc) {
      fullQueryMessage += `\n\n[Attached Reference Document: ${stagedDoc.name}\nContent:\n${stagedDoc.content}]`;
    }

    const newUserMessage = {
      role: 'user',
      content: message + (stagedDoc ? ` 📎 (${stagedDoc.name})` : '')
    };

    const updatedHistory = [...(activeSession?.history || []), newUserMessage];
    updateActiveSessionHistory(updatedHistory);
    setMessage('');
    setStagedDoc(null);
    setLoading(true);

    setRequestTimestamps(prev => {
      const now = Date.now();
      return [...prev.filter(t => now - t < 60000), now];
    });

    // Update global Stats
    setStats(prev => ({
      questionsAsked: prev.questionsAsked + 1,
      topicsLearned: prev.topicsLearned + (message.trim().length > 15 ? 1 : 0)
    }));

    // Placeholder for streamed response
    const botMessagePlaceholder = { role: 'model', content: '' };
    const historyWithBot = [...updatedHistory, botMessagePlaceholder];
    updateActiveSessionHistory(historyWithBot);

    try {
      // Format history payload
      const formattedHistory = [];
      let tempUserMsg = null;
      for (const msg of activeSession.history) {
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
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact the model");
      }

      // Stream response chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        streamText += chunk;

        // Update bot message content in real time
        updateActiveSessionHistory([
          ...updatedHistory,
          { role: 'model', content: streamText }
        ]);
      }

    } catch (err) {
      updateActiveSessionHistory([
        ...updatedHistory,
        { role: 'model', content: `⚠️ Error: Could not stream response from AI backend. Verify server connection.` }
      ]);    } finally {
      setLoading(false);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (promptPrefix) => {
    setMessage(promptPrefix);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    updateActiveSessionHistory([]);
    setStagedDoc(null);
  };

  const currentRPM = requestTimestamps.filter(t => Date.now() - t < 60000).length;

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] gap-6 w-full">
      
      {/* Chat Workspace (Left side) */}
      <div className="flex-1 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
      
      {/* Tab Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-850 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-sm text-zinc-850 dark:text-zinc-250">💬 Study Workspace</h3>
          <span className="text-zinc-300 dark:text-zinc-800 text-xs">|</span>
          <span className="text-[11px] font-semibold text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded-md">
            {persona} Mode
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            title="Keyboard Shortcuts"
            aria-label="View Keyboard Shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
          
          <button 
            onClick={clearChat}
            disabled={!activeSession?.history || activeSession.history.length === 0}
            className="text-xs text-zinc-500 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-zinc-500 flex items-center space-x-1.5 transition-colors"
            aria-label="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear Session</span>
          </button>
        </div>
      </div>

      {/* Shortcuts overlay panel */}
      {showShortcuts && (
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-6 py-3 border-b border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>⌨️ <kbd className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Ctrl + Enter</kbd> to Send</span>
            <span>⌨️ <kbd className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">/</kbd> to Focus input</span>
          </div>
          <button onClick={() => setShowShortcuts(false)} className="text-zinc-450 hover:text-zinc-200 font-bold">✕</button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {(!activeSession?.history || activeSession.history.length === 0) ? (
          <div className="max-w-2xl mx-auto text-center py-10 px-4 space-y-6">
            <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-850 dark:text-zinc-150">Start Learning with Neural Nexus</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Choose a persona in the settings panel to change the AI's explanation style, or generate a quiz on the Quiz view.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 text-left max-w-lg mx-auto">
              <h4 className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">💡 Quick Guide:</h4>
              <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-355">
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-500 font-bold">1.</span>
                  <span>Select any of the <b>Quick Actions</b> below to pre-populate common study prompts.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-500 font-bold">2.</span>
                  <span>Drag and drop text/notes in the <b>My Documents</b> tab, then click <b>"Chat with Doc"</b> to reference it here.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-indigo-500 font-bold">3.</span>
                  <span>Formulate follow-up questions to dig deeper into answers.</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {activeSession.history.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm leading-relaxed border ${
                    isUser 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/5' 
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150/10 dark:border-zinc-850 text-zinc-850 dark:text-zinc-200'
                  }`}>
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        className="prose dark:prose-invert prose-xs max-w-none text-zinc-850 dark:text-zinc-200 font-sans space-y-2"
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-3 mb-1" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold mt-2.5 mb-1" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                          code: ({node, inline, className, children, ...props}) => {
                            return inline ? (
                              <code className="font-mono bg-zinc-200 dark:bg-zinc-800 rounded px-1 text-xs text-indigo-500 dark:text-indigo-400 font-semibold" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-zinc-900 text-zinc-100 font-mono p-4 rounded-xl text-xs overflow-x-auto my-3 border border-zinc-800 w-full">
                                <code {...props}>{children}</code>
                              </pre>
                            )
                          },
                          table: ({node, ...props}) => <table className="border-collapse border border-zinc-350 dark:border-zinc-800 w-full my-3" {...props} />,
                          th: ({node, ...props}) => <th className="border border-zinc-350 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-left text-xs font-bold" {...props} />,
                          td: ({node, ...props}) => <td className="border border-zinc-350 dark:border-zinc-800 px-3 py-1.5 text-xs" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-1" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-zinc-550 my-2" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150/10 dark:border-zinc-850 rounded-2xl px-5 py-3.5 flex items-center space-x-3 text-xs text-zinc-450">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                  <span>Streaming tokens...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Quick Actions Panel */}
      {(!activeSession?.history || activeSession.history.length === 0) && (
        <div className="px-6 py-2 border-t border-zinc-100 dark:border-zinc-800/40">
          <div className="w-full">
            <h4 className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-550 uppercase tracking-widest mb-2">⚡ Quick Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="p-3 text-left bg-zinc-50 hover:bg-indigo-50/40 dark:bg-zinc-900/30 dark:hover:bg-indigo-950/20 border border-zinc-200/55 dark:border-zinc-800/80 rounded-xl transition-all hover:-translate-y-0.5"
                  aria-label={`Action: ${action.label}`}
                >
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-250 block mb-1">
                    {action.label}
                  </span>
                  <span className="text-[10px] text-zinc-450 leading-normal block">
                    Preloads template prompt
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Panel */}
      <div className="p-6 border-t border-zinc-200/85 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/10">
        <form onSubmit={handleSendMessage} className="w-full space-y-3">
          
          {/* Display Staged Reference Doc */}
          {stagedDoc && (
            <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs w-fit">
              <span>Attached: 📄 <b>{stagedDoc.name}</b></span>
              <button 
                type="button" 
                onClick={() => setStagedDoc(null)}
                className="hover:bg-indigo-500/20 p-0.5 rounded-full transition-all ml-1.5"
                aria-label="Remove document attachment"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-end space-x-3">
            {/* Input field */}
            <div className="flex-1 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 flex items-end space-x-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
              <textarea
                ref={inputRef}
                rows="2"
                placeholder="Ask a question or enter a topic... (e.g. Break down Bayes' theorem)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDownInput}
                className="flex-1 text-sm bg-transparent border-0 outline-none focus:ring-0 resize-none px-2 text-zinc-850 dark:text-zinc-100"
                aria-label="Study query text"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!message.trim() && !stagedDoc) || loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* AI Quota & Status (Right side) */}
    <div className="hidden xl:flex flex-col w-80 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h3 className="font-semibold text-sm text-zinc-850 dark:text-zinc-250 flex items-center space-x-2">
          <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
          <span>AI Quota & Status</span>
        </h3>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
          Real-time API threshold monitoring
        </p>
      </div>

        {/* Model Identifier */}
        <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/60 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium block">ACTIVE MODEL</span>
          <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-250 block truncate">
            {selectedModel === 'gemini-2.5-pro' ? '🧠 Deep Thinking (Pro)' : '⚡ Quick Mode (Flash)'}
          </span>
        </div>

        {/* Requests Per Minute (RPM) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Request Rate (RPM)</span>
            <span className="font-bold text-indigo-500">{currentRPM} / 15 RPM</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min((currentRPM / 15) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block">
            Rate limit resets every 60 seconds.
          </span>
        </div>

        {/* Requests Per Day (RPD) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Daily Requests (RPD)</span>
            <span className="font-bold text-emerald-550">{stats.questionsAsked} / 1,500 RPD</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min((stats.questionsAsked / 1500) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block">
            Daily limit refreshes at midnight UTC.
          </span>
        </div>

        {/* Token quota gauge (TPM) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Token Bandwidth (TPM)</span>
            <span className="font-bold text-amber-500">~{stats.questionsAsked * 800} / 1M TPM</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min(((stats.questionsAsked * 800) / 1000000) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block">
            Maximum token throughput per minute.
          </span>
        </div>

        {/* Status Indicator */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between text-[11px]">
          <span className="text-zinc-450 dark:text-zinc-500">AI Core Connection</span>
          <div className="flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Optimal</span>
          </div>
        </div>
      </div>

    </div>
  );
}
