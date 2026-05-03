import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Progress from './pages/Progress';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="problems" element={<Problems />} />
          <Route path="problems/:slug" element={<ProblemDetail />} />
          <Route path="progress" element={<Progress />} />
          <Route path="topics" element={<Topics />} />
          <Route path="topics/:slug" element={<TopicDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
