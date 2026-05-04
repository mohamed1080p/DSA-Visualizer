import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Progress from './pages/Progress';
import Chatbot from './pages/Chatbot';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import LearningPaths from './pages/LearningPaths';
import LearningPathDetail from './pages/LearningPathDetail';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="auth" element={<Auth />} />
            <Route path="problems" element={<Problems />} />
            <Route path="problems/:slug" element={<ProblemDetail />} />
            <Route path="progress" element={<Progress />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="topics" element={<Topics />} />
            <Route path="topics/:slug" element={<TopicDetail />} />
            <Route path="paths" element={<LearningPaths />} />
            <Route path="paths/:slug" element={<LearningPathDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
