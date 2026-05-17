import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthProvider';
import { SignalRProvider } from '@/context/SignalRContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import TopicsPage from '@/pages/TopicsPage';
import TopicDetailPage from '@/pages/TopicDetailPage';
import ProblemsPage from '@/pages/ProblemsPage';
import ProblemDetailPage from '@/pages/ProblemDetailPage';
import VisualizerPage from '@/pages/VisualizerPage';
import PathPage from '@/pages/PathPage';
import PlaygroundPage from '@/pages/PlaygroundPage';
import ProgressPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ExternalAuthCallbackPage from '@/pages/ExternalAuthCallbackPage';
import CommunityPage from '@/pages/CommunityPage';
import BattleArenaPage from '@/pages/BattleArenaPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SignalRProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/topics/:slug" element={<TopicDetailPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/problems/:slug" element={<ProblemDetailPage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/visualizer" element={<VisualizerPage />} />
            <Route path="/path" element={<PathPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <CommunityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/battle"
              element={
                <ProtectedRoute>
                  <BattleArenaPage />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<Navigate to="/progress" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/external-callback" element={<ExternalAuthCallbackPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SignalRProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
