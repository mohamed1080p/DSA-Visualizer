import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Send, Clock, Database, ChevronLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import api from '../api/axios';

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

interface ProblemDetail {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  topicName: string;
  slug: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  sampleTestCases: TestCase[];
}

interface SubmissionResult {
  id: number;
  status: string;
  verdict: string;
  language: string;
  runtimeMs: number | null;
  memoryKb: number | null;
}

const ProblemDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('fromPath');

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('cs');
  const [code, setCode] = useState('// Write your solution here\n\npublic class Solution {\n    public void Solve() {\n        \n    }\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await api.get(`/problems/${slug}`);
        setProblem(response.data);
      } catch (error) {
        console.error('Failed to fetch problem:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
    
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [slug]);

  useEffect(() => {
    document.title = problem ? `${problem.title} — DSA Visualizer` : 'Loading... — DSA Visualizer';
  }, [problem]);

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const response = await api.post(`/submissions/${slug}`, {
        code,
        language,
        slug: problem.slug
      });

      const submissionId = response.data.submissionId;
      startPolling(submissionId);
    } catch (error) {
      console.error('Submission failed:', error);
      setIsSubmitting(false);
    }
  };

  const startPolling = (id: number) => {
    pollingRef.current = window.setInterval(async () => {
      try {
        const response = await api.get(`/submissions/${id}`);
        const data = response.data;
        
        if (data.status !== 'Queued' && data.status !== 'Processing') {
          setSubmissionResult(data);
          setIsSubmitting(false);
          if (pollingRef.current) window.clearInterval(pollingRef.current);
          
          if (data.verdict === 'Accepted' && fromPath) {
            setTimeout(() => {
              navigate(`/paths/${fromPath}`);
            }, 2500);
          }
        }
      } catch (error) {
        console.error('Polling failed:', error);
        setIsSubmitting(false);
        if (pollingRef.current) window.clearInterval(pollingRef.current);
      }
    }, 2000);
  };

  if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="text-gradient">Loading challenge...</div></div>;
  if (!problem) return <div className="container">Problem not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', padding: '0 1rem' }}>
      <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => {
          if (fromPath) navigate(`/paths/${fromPath}`);
          else navigate('/problems');
        }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem' }}>
          <ChevronLeft size={20} /> {fromPath ? 'Back to Path' : ''}
        </button>
        <h1 className="heading-lg" style={{ fontSize: '1.5rem' }}>{problem.title}</h1>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          padding: '0.2rem 0.6rem', 
          borderRadius: '1rem',
          background: 'rgba(99, 102, 241, 0.1)',
          color: 'var(--primary-color)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          {problem.topicName}
        </span>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden', paddingBottom: '1rem' }}>
        {/* Description Panel */}
        <div className="glass-panel" style={{ flex: '0 0 40%', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Clock size={16} /> {problem.timeLimitMs}ms
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Database size={16} /> {problem.memoryLimitKb}KB
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              {problem.description}
            </div>
          </section>

          <section>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Sample Test Cases</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {problem.sampleTestCases.map((tc, idx) => (
                <div key={tc.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>CASE {idx + 1}</div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input:</div>
                    <code style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{tc.input}</code>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expected Output:</div>
                    <code style={{ fontSize: '0.875rem', color: 'var(--success-color)' }}>{tc.expectedOutput}</code>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Editor Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Language:</div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--surface-border)', 
                color: 'var(--text-primary)',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="cs">CS</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', padding: '1px' }}>
            <Editor
              height="100%"
              language={language === 'cs' ? 'csharp' : language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 }
              }}
            />
          </div>

          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary">
                <Play size={18} />
                Run Code
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <AnimatePresence>
                {submissionResult && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      color: submissionResult.verdict === 'Accepted' ? 'var(--success-color)' : 'var(--error-color)',
                      fontWeight: 600
                    }}
                  >
                    {submissionResult.verdict === 'Accepted' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {submissionResult.verdict}
                    {submissionResult.runtimeMs && <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>({submissionResult.runtimeMs}ms)</span>}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="btn btn-primary" 
                style={{ padding: '0.75rem 2rem' }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
