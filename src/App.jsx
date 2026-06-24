import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import QuizPage from './pages/QuizPage';
import DocsPage from './pages/DocsPage';
import PlansPage from './pages/PlansPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ChatPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="plans" element={<PlansPage />} />
      </Route>
    </Routes>
  );
}
