import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StudyProvider } from './context/StudyContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StudyProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </StudyProvider>
  </React.StrictMode>,
)
