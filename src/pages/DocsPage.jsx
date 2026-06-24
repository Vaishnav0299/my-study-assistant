import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Trash2, MessageSquare, ArrowUp, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocsPage() {
  const [documents, setDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const navigate = useNavigate();

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('study_documents');
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveDocuments = (updatedDocs) => {
    setDocuments(updatedDocs);
    localStorage.setItem('study_documents', JSON.stringify(updatedDocs));
  };

  const onDrop = React.useCallback((acceptedFiles) => {
    acceptedFiles.forEach(async (file) => {
      const fileId = `${file.name}-${Date.now()}`;
      
      // Initialize progress
      setUploadingFiles(prev => ({ 
        ...prev, 
        [fileId]: { name: file.name, progress: 10, status: 'uploading' } 
      }));

      // Simulate a smooth upload progress bar while posting to the backend
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          if (!prev[fileId] || prev[fileId].progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            [fileId]: { ...prev[fileId], progress: prev[fileId].progress + 15 }
          };
        });
      }, 150);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await response.json();
        
        clearInterval(progressInterval);
        
        // Mark upload complete
        setUploadingFiles(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], progress: 100, status: 'complete' }
        }));

        // Add to documents list
        const newDoc = {
          id: fileId,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          content: data.content,
          preview: data.content.slice(0, 200) + (data.content.length > 200 ? '...' : ''),
          timestamp: Date.now()
        };

        setDocuments(prev => {
          const updated = [newDoc, ...prev];
          localStorage.setItem('study_documents', JSON.stringify(updated));
          return updated;
        });

        // Clear upload item after 1 second
        setTimeout(() => {
          setUploadingFiles(prev => {
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
          });
        }, 1000);

      } catch (err) {
        clearInterval(progressInterval);
        setUploadingFiles(prev => ({
          ...prev,
          [fileId]: { ...prev[fileId], status: 'failed', progress: 100 }
        }));
        setTimeout(() => {
          setUploadingFiles(prev => {
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
          });
        }, 3000);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/x-python': ['.py']
    }
  });

  const deleteDoc = (id) => {
    const updated = documents.filter(doc => doc.id !== id);
    saveDocuments(updated);
  };

  const handleChatWithDoc = (doc) => {
    // Stage document to be attached on the ChatPage
    localStorage.setItem('staged_document_to_chat', JSON.stringify({
      name: doc.name,
      content: doc.content
    }));
    navigate('/');
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* Header */}
      <div className="border-b border-zinc-200/60 dark:border-zinc-850 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center space-x-2 text-zinc-800 dark:text-zinc-200">
          <FileText className="h-4 w-4 text-indigo-500" />
          <span>Document Management Workspace</span>
        </h3>
      </div>

      {/* Content scroll container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Dropzone Container */}
        <div className="max-w-xl mx-auto">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 hover:border-zinc-400 dark:hover:border-zinc-700'
            }`}
            aria-label="Document upload dropzone"
          >
            <input {...getInputProps()} />
            <div className="space-y-3">
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                <ArrowUp className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {isDragActive ? 'Drop your files here' : 'Drag & Drop files here, or click to browse'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-450">
                  Supports text, notes, markdown, python, csv, json
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Uploading progress section */}
        {Object.keys(uploadingFiles).length > 0 && (
          <div className="max-w-xl mx-auto space-y-2">
            <h5 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Uploading Queue</h5>
            <div className="space-y-2">
              {Object.keys(uploadingFiles).map((id) => {
                const item = uploadingFiles[id];
                return (
                  <div key={id} className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold truncate max-w-[200px]">{item.name}</span>
                      <span className="text-zinc-500 flex items-center space-x-1">
                        {item.status === 'uploading' && <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />}
                        {item.status === 'complete' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        <span className="capitalize">{item.status}</span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-150 ${item.status === 'failed' ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Uploaded Documents List */}
        <div className="max-w-2xl mx-auto space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 border-b border-zinc-100 dark:border-zinc-850 pb-2">
            📚 Uploaded Documents ({documents.length})
          </h4>

          {documents.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 space-y-2">
              <FileText className="h-10 w-10 mx-auto opacity-20 text-indigo-500" />
              <p className="text-xs">No documents uploaded yet. Upload reference notes to chat with them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col space-y-3 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h5 className="font-semibold text-sm text-zinc-850 dark:text-zinc-200 flex items-center space-x-2">
                        <FileText className="h-4.5 w-4.5 text-indigo-500" />
                        <span>{doc.name}</span>
                      </h5>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-450">
                        Size: {doc.size} | Uploaded {new Date(doc.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleChatWithDoc(doc)}
                        className="bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-500/20 p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                        title="Chat with Document"
                        aria-label={`Chat with ${doc.name}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => deleteDoc(doc.id)}
                        className="hover:bg-rose-500/10 text-zinc-400 hover:text-rose-550 p-2 rounded-xl transition-all"
                        title="Delete Document"
                        aria-label={`Delete ${doc.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 p-3.5 rounded-xl">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-550 block mb-1">Parsed Preview:</span>
                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {doc.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
