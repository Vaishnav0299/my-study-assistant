import React, { useState } from 'react';
import { Calendar, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function PlansPage() {
  const { persona, selectedModel } = useStudy();
  const [topic, setTopic] = useState('');
  const [days, setDays] = useState('5');
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const generatePlan = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSchedule([]);

    const planPrompt = `Generate a ${days}-day study plan schedule for learning: "${topic}".
Output MUST be a valid JSON array of objects, where each object has these exact keys:
- "day" (string, e.g. "Day 1")
- "focus" (string, main concept to learn)
- "milestone" (string, goal or task to complete)

Do not wrap the output in markdown code blocks like \`\`\`json. Return only the raw JSON string array.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: planPrompt,
          history: [],
          persona: persona,
          model: selectedModel
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate plan");
      }

      // Sanitize potential markdown code blocks returned by Gemini
      let cleanedText = data.response.trim();
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

      const parsedSchedule = JSON.parse(cleanedText);
      if (Array.isArray(parsedSchedule) && parsedSchedule.length > 0) {
        setSchedule(parsedSchedule);
      } else {
        throw new Error("Invalid format returned by model");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate a structured study plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-850 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center space-x-2 text-zinc-800 dark:text-zinc-200">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>Study Plan Generator</span>
        </h3>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Input form */}
        <form onSubmit={generatePlan} className="max-w-xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Target Topic / Course</label>
              <input
                type="text"
                placeholder="e.g. Data Structures, Cell Biology, French basics..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                aria-label="Course topic input"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Duration (Days)</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={loading}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300"
                aria-label="Study duration select"
              >
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm shadow-indigo-600/10"
          >
            {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
            <span>{loading ? 'Creating Syllabus...' : 'Create Study Timeline'}</span>
          </button>
          
          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
          )}
        </form>

        {/* Timeline representation */}
        {schedule.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="border-t border-zinc-100 dark:border-zinc-850 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-6">
                📅 Timetable Roadmap: {topic} ({days} Days)
              </h4>
              
              <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6">
                {schedule.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white dark:bg-zinc-950 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                    </div>
                    
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-5 hover:shadow-sm transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded-md">
                          {item.day}
                        </span>
                      </div>
                      <h5 className="font-semibold text-sm text-zinc-850 dark:text-zinc-250">
                        {item.focus}
                      </h5>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-center space-x-1">
                        <ChevronRight className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                        <span><b>Milestone:</b> {item.milestone}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Empty state */}
        {schedule.length === 0 && !loading && (
          <div className="max-w-md mx-auto text-center py-16 text-zinc-400 dark:text-zinc-550 space-y-3">
            <Calendar className="h-10 w-10 mx-auto opacity-30 text-indigo-500" />
            <p className="text-sm">Input your subject and timeline above to map out a clear day-by-day learning roadmap.</p>
          </div>
        )}

      </div>

    </div>
  );
}
