import React, { useState } from 'react';
import { HelpCircle, Sparkles, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function QuizPage() {
  const { persona, selectedModel } = useStudy();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSubmitted(false);
    setUserAnswers({});
    setQuizQuestions([]);

    // Prompt requesting structured JSON output
    const quizPrompt = `Generate a 3-question multiple choice quiz on the topic: "${topic}". 
Output MUST be a valid JSON array of objects, where each object has these exact keys:
- "question" (string)
- "options" (array of 4 strings)
- "correct" (integer, index of the correct option, 0 to 3)

Do not wrap the output in markdown block like \`\`\`json. Return only the raw JSON string array.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: quizPrompt,
          history: [],
          persona: persona,
          model: selectedModel
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate quiz");
      }

      // Sanitize potential markdown code blocks returned by Gemini
      let cleanedText = data.response.trim();
      cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

      const parsedQuestions = JSON.parse(cleanedText);
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        setQuizQuestions(parsedQuestions);
      } else {
        throw new Error("Invalid format returned by model");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate a structured quiz. Please try again with a different topic name.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIdx, oIdx) => {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const scoreQuiz = () => {
    setSubmitted(true);
  };

  const scoreCount = quizQuestions.reduce((acc, q, idx) => {
    return acc + (userAnswers[idx] === q.correct ? 1 : 0);
  }, 0);

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-850 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center space-x-2 text-zinc-800 dark:text-zinc-200">
          <HelpCircle className="h-4 w-4 text-indigo-500" />
          <span>Interactive Quiz Generator</span>
        </h3>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Input form */}
        <form onSubmit={generateQuiz} className="max-w-xl mx-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-405">Quiz Topic</label>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="e.g. JavaScript Closures, photosynthesis, SQL Joins..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
                className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                aria-label="Quiz topic input"
              />
              
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="bg-indigo-655 bg-indigo-600 hover:bg-indigo-755 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
              >
                {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                <span>{loading ? 'Generating...' : 'Generate'}</span>
              </button>
            </div>
          </div>
          
          {errorMsg && (
            <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
          )}
        </form>

        {/* Display quiz questions */}
        {quizQuestions.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="border-t border-zinc-100 dark:border-zinc-850 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-4">
                📝 Multiple Choice Test: {topic}
              </h4>
              
              <div className="space-y-5">
                {quizQuestions.map((q, qIdx) => {
                  const selectedIdx = userAnswers[qIdx];
                  const correctIdx = q.correct;
                  
                  return (
                    <div key={qIdx} className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3.5">
                      <h5 className="font-semibold text-sm text-zinc-850 dark:text-zinc-200 flex items-start space-x-2">
                        <span className="text-indigo-500">{qIdx + 1}.</span>
                        <span>{q.question}</span>
                      </h5>
                      
                      <div className="grid grid-cols-1 gap-2 pl-4">
                        {q.options.map((option, oIdx) => {
                          const isSelected = selectedIdx === oIdx;
                          const isCorrectOption = correctIdx === oIdx;
                          
                          let cardStyle = 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50';
                          let icon = null;

                          if (submitted) {
                            if (isCorrectOption) {
                              cardStyle = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
                              icon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
                            } else if (isSelected) {
                              cardStyle = 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400';
                              icon = <XCircle className="h-4 w-4 text-rose-500" />;
                            }
                          } else if (isSelected) {
                            cardStyle = 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400';
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleOptionSelect(qIdx, oIdx)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${cardStyle}`}
                              aria-label={`Question ${qIdx + 1} option ${oIdx + 1}`}
                            >
                              <span>{option}</span>
                              {icon}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score & Submit Buttons */}
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-6">
              {!submitted ? (
                <button
                  type="button"
                  onClick={scoreQuiz}
                  disabled={Object.keys(userAnswers).length < quizQuestions.length}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm shadow-indigo-600/10"
                >
                  Submit & Score Quiz
                </button>
              ) : (
                <div className="flex items-center space-x-6">
                  <div className="text-sm font-bold">
                    Score: <span className={scoreCount === quizQuestions.length ? 'text-emerald-500' : 'text-indigo-500'}>{scoreCount}</span> / {quizQuestions.length}
                  </div>
                  <button
                    type="button"
                    onClick={generateQuiz}
                    className="border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold py-2.5 px-6 rounded-xl transition-all"
                  >
                    Retake / Regenerate
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Empty placeholder */}
        {quizQuestions.length === 0 && !loading && (
          <div className="max-w-md mx-auto text-center py-16 text-zinc-400 dark:text-zinc-500 space-y-3">
            <HelpCircle className="h-10 w-10 mx-auto opacity-30 text-indigo-500" />
            <p className="text-sm">Enter a topic above to generate a custom multiple-choice quiz and test your skills.</p>
          </div>
        )}

      </div>

    </div>
  );
}
