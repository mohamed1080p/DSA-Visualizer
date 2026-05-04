import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Info, Clock, CheckCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import api from '../api/axios';

interface Complexity {
  operationName: string;
  timeComplexity: string;
  spaceComplexity: string;
}

interface CodeImplementation {
  language: string;
  code: string;
  stepsJson: string;
}

interface Step {
  step: number;
  line: number;
  description: string;
  state?: any;
}

const Visualizer = ({ state, type, onNodeClick }: { state: any, type: string, onNodeClick?: (id: number) => void }) => {
  if (!state || !state.array && !state.items && !state.nodes) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Visualization data for this step is still being processed.<br />
        Please check back soon for the full interactive experience!
      </div>
    );
  }

  // --- ARRAY VISUALIZER (Search / Sort) ---
  if ((type === 'array' || type === 'sort') && state.array) {
    const { array, left, right, mid, highlight, found, swap } = state;
    return (
      <>
        <div className="visualizer-title">{type === 'sort' ? 'Sorting' : 'Array'} Visualization</div>
        <div className="array-container">
          {array?.map((val: number, idx: number) => {
            const isActive = (idx >= (left ?? -1) && idx <= (right ?? Infinity));
            const isHighlight = idx === highlight || (swap && Array.isArray(swap) && swap.includes(idx));
            const isFound = idx === found;
            const isUnchecked = !isActive && !isFound && !isHighlight;

            return (
              <div
                key={idx}
                className={`array-element ${isActive ? 'active' : ''} ${isHighlight ? 'highlight' : ''} ${isFound ? 'found' : ''} ${isUnchecked ? 'unchecked' : ''}`}
                style={{ height: type === 'sort' ? `${40 + val * 2}px` : '60px' }}
              >
                {val}
                <div className="pointers-stack">
                  {idx === left && <div className="pointer-tag">{type === 'sort' ? 'i' : 'left'}</div>}
                  {idx === mid && <div className="pointer-tag">mid</div>}
                  {idx === right && <div className="pointer-tag">{type === 'sort' ? 'j' : 'right'}</div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="visualizer-legend">
          <div className="legend-item"><div className="legend-color" style={{ background: '#f59e0b' }}></div><span>{type === 'sort' ? 'Comparing / Swapping' : 'Middle Element'}</span></div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#10b981' }}></div><span>Found / Sorted</span></div>
          <div className="legend-item"><div className="legend-color" style={{ background: '#93c5fd' }}></div><span>Active Range</span></div>
        </div>
      </>
    );
  }

  // --- STACK VISUALIZER ---
  if ((type === 'stack' || state.type === 'stack') && state.items) {
    const items = state.items || [];
    return (
      <div className="stack-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '4px', borderBottom: '4px solid var(--surface-border)', paddingBottom: '4px' }}>
          {items.map((val: any, idx: number) => {
            const isHighlighted = state.highlight === idx || state.swap?.includes(idx);
            return (
              <div key={idx} className={`array-element ${isHighlighted ? 'highlight' : 'active'}`} style={{ width: '120px', position: 'relative' }}>
                {val}
                {idx === items.length - 1 && <div style={{ position: 'absolute', right: '-60px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.7rem' }}>← TOP</div>}
              </div>
            );
          })}
          {items.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Stack is empty</div>}
        </div>
        <div className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Stack Floor</div>
      </div>
    );
  }

  // --- QUEUE VISUALIZER ---
  if (type === 'queue' || state.type === 'queue') {
    const items = state.items || [];
    return (
      <div className="queue-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '100px' }}>
          {items.map((val: any, idx: number) => {
            const isHighlighted = state.highlight === idx;
            return (
              <div key={idx} style={{ position: 'relative' }}>
                {idx === 0 && <div style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', color: 'var(--accent-secondary)', fontWeight: 800, fontSize: '0.7rem' }}>FRONT</div>}
                {idx === items.length - 1 && <div style={{ position: 'absolute', bottom: '-35px', left: '50%', transform: 'translateX(-50%)', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.7rem' }}>REAR</div>}
                <div className={`array-element ${isHighlighted ? 'highlight' : 'active'}`} style={{ width: '80px' }}>
                  {val}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Queue is empty (Waiting for data...)</div>}
        </div>
        <div style={{ display: 'flex', gap: '4rem', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span>← Exit (Dequeue)</span>
          <span>Entrance (Enqueue) →</span>
        </div>
      </div>
    );
  }

  // --- LINKED LIST VISUALIZER ---
  if (type === 'linked-list' || state.type === 'linked-list') {
    const nodes = state.nodes || [];
    return (
      <div className="flex items-center gap-4 p-8 overflow-x-auto min-h-[200px]" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
        {nodes.map((node: any, idx: number) => (
          <div key={node.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Node Container */}
            <div style={{ position: 'relative' }}>
              {idx === 0 && <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Head</div>}
              {idx === nodes.length - 1 && <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-secondary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Tail</div>}

              <div style={{
                display: 'flex',
                border: `2px solid ${node.highlight ? 'var(--accent-primary)' : 'var(--surface-border)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                background: node.highlight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                boxShadow: node.highlight ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none'
              }}>
                {/* Data Section */}
                <div style={{
                  padding: '1rem 1.5rem',
                  borderRight: '2px solid var(--surface-border)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  {node.val}
                </div>
                {/* Next Pointer Section */}
                <div style={{
                  width: '40px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>Data</span>
                <span>Next</span>
              </div>
            </div>

            {/* Arrow to next node */}
            {idx < nodes.length - 1 && (
              <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '30px', height: '2px', background: 'currentColor' }}></div>
                <div style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid currentColor', marginLeft: '-2px' }}></div>
              </div>
            )}
          </div>
        ))}
        {nodes.length === 0 && <div className="text-secondary">Empty List</div>}
      </div>
    );
  }

  // --- TREE VISUALIZER (Binary Tree, BST, DFS, BFS) ---
  if (type === 'tree' || state.type === 'tree') {
    const nodes = state.nodes || [];
    const traversalResult = state.traversalResult || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '400px' }}>
        <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: '350px' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
            {nodes.map((node: any) => (
              <div key={`node-group-${node.id}`}>
                {/* Lines to children */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                  {node.left && nodes.find((n: any) => n.id === node.left) && (
                    <>
                      <line
                        x1={`${node.x}%`} y1={`${node.y}%`}
                        x2={`${nodes.find((n: any) => n.id == node.left)?.x || 0}%`} y2={`${nodes.find((n: any) => n.id == node.left)?.y || 0}%`}
                        stroke="var(--surface-border)" strokeWidth="2"
                      />
                      <text x={`${((node.x || 0) + (nodes.find((n: any) => n.id == node.left)?.x || 0)) / 2}%`} y={`${((node.y || 0) + (nodes.find((n: any) => n.id == node.left)?.y || 0)) / 2}%`} fill="var(--text-secondary)" fontSize="12" fontWeight="bold" dy="-8" dx="-8">L</text>
                    </>
                  )}
                  {node.right && nodes.find((n: any) => n.id === node.right) && (
                    <>
                      <line
                        x1={`${node.x}%`} y1={`${node.y}%`}
                        x2={`${nodes.find((n: any) => n.id == node.right)?.x || 0}%`} y2={`${nodes.find((n: any) => n.id == node.right)?.y || 0}%`}
                        stroke="var(--surface-border)" strokeWidth="2"
                      />
                      <text x={`${((node.x || 0) + (nodes.find((n: any) => n.id == node.right)?.x || 0)) / 2}%`} y={`${((node.y || 0) + (nodes.find((n: any) => n.id == node.right)?.y || 0)) / 2}%`} fill="var(--text-secondary)" fontSize="12" fontWeight="bold" dy="-8" dx="8">R</text>
                    </>
                  )}
                </svg>

                {/* Node Circle */}
                <div
                  className={`array-element ${node.highlight ? 'highlight' : node.found ? 'found' : node.deleted ? 'deleted' : node.visited ? 'active' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${node.x || 0}%`,
                    top: `${node.y || 0}%`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: node.highlight ? '0 0 15px var(--accent-primary)' : 'none'
                  }}
                >
                  {node.val}
                </div>
              </div>
            ))}
          </div>
          {nodes.length === 0 && <div className="text-secondary p-8 text-center">Tree is empty. Insert a value to start!</div>}
        </div>

        {traversalResult.length > 0 && (
          <div style={{ padding: '1rem', borderTop: '2px solid var(--surface-border)', background: 'rgba(99, 102, 241, 0.05)', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Traversal Result</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {traversalResult.map((v: number, i: number) => (
                <div key={i} className="array-element active" style={{ width: 'auto', minWidth: '35px', padding: '0 0.5rem', height: '35px', fontSize: '0.8rem' }}>{v}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- GRAPH VISUALIZER (DFS, BFS) ---
  if (type === 'graph' || state.type === 'graph') {
    const nodes = state.nodes || [];
    const edges = state.edges || [];
    const traversalResult = state.traversalResult || [];

    // Helper to find node coordinates
    const getNode = (id: number) => nodes.find((n: any) => n.id === id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '400px' }}>
        <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: '350px' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            {edges.map((edge: any, idx: number) => {
              const source = getNode(edge.source);
              const target = getNode(edge.target);
              if (!source || !target) return null;

              let strokeColor = 'var(--surface-border)';
              let strokeWidth = 2;
              if (edge.state === 'tree') {
                strokeColor = '#10b981'; // Green
                strokeWidth = 3;
              } else if (edge.state === 'back' || edge.state === 'cross') {
                strokeColor = '#ef4444'; // Red
                strokeWidth = 3;
              }

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={`${source.x}%`} y1={`${source.y}%`}
                    x2={`${target.x}%`} y2={`${target.y}%`}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.state === 'back' ? '5,5' : 'none'}
                  />
                  {edge.label && (
                    <text
                      x={`${(source.x + target.x) / 2}%`}
                      y={`${(source.y + target.y) / 2}%`}
                      fill="var(--text-secondary)"
                      fontSize="12"
                      fontWeight="bold"
                      dy="-8"
                      dx={edge.label === 'L' ? -8 : 8}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {nodes.map((node: any) => {
            let className = `array-element`;
            let additionalStyle: React.CSSProperties = {
              position: 'absolute',
              left: `${node.x || 0}%`,
              top: `${node.y || 0}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              fontSize: '0.9rem',
              fontWeight: 700,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: onNodeClick ? 'pointer' : 'default',
              transition: 'all 0.3s ease'
            };

            if (node.state === 'visiting') {
              additionalStyle.background = 'var(--accent-secondary)'; // Usually yellow/orange
              additionalStyle.color = '#fff';
              additionalStyle.border = 'none';
              additionalStyle.boxShadow = '0 0 15px var(--accent-secondary)';
            } else if (node.state === 'explored') {
              className += ' active';
              additionalStyle.boxShadow = '0 0 15px var(--accent-primary)';
            } else if (node.state === 'bfs-explored') {
              additionalStyle.background = 'rgba(16, 185, 129, 0.2)'; // Green
              additionalStyle.color = '#fff';
              additionalStyle.border = '2px solid #10b981';
              additionalStyle.boxShadow = '0 0 15px rgba(16, 185, 129, 0.5)';
            }

            if (node.isStart && node.state !== 'visiting' && node.state !== 'explored') {
              additionalStyle.boxShadow = '0 0 0 3px var(--accent-primary)';
            }

            return (
              <div
                key={`graph-node-${node.id}`}
                onClick={() => onNodeClick && onNodeClick(node.id)}
                className={className}
                style={additionalStyle}
              >
                {node.val}
              </div>
            );
          })}
        </div>

        {state.currentLevel !== undefined && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--surface-border)', zIndex: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Level: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{state.currentLevel}</strong>
          </div>
        )}

        {state.queueData && (
          <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--surface-border)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Queue</span>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Out &larr;</span>
              <div style={{ display: 'flex', gap: '0.25rem', minWidth: '100px', height: '30px', borderBottom: '2px solid var(--surface-border)', paddingBottom: '0.25rem' }}>
                {state.queueData.length === 0 ? (
                  <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', alignSelf: 'center' }}>Empty</div>
                ) : (
                  state.queueData.map((v: number, i: number) => (
                    <div key={i} className="array-element highlight" style={{ width: '25px', height: '25px', fontSize: '0.7rem' }}>{v}</div>
                  ))
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>&larr; In</span>
            </div>
          </div>
        )}

        {traversalResult.length > 0 && (
          <div style={{ padding: '1rem', borderTop: '2px solid var(--surface-border)', background: 'rgba(99, 102, 241, 0.05)', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Traversal Result</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {traversalResult.map((v: number, i: number) => (
                <div key={i} className="array-element active" style={{ width: 'auto', minWidth: '35px', padding: '0 0.5rem', height: '35px', fontSize: '0.8rem' }}>{v}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

interface TopicDetail {
  id: number;
  title: string;
  description: string;
  slug: string;
  explanation: string;
  difficulty: string;
  categoryName: string;
  complexities: Complexity[];
  codeImplementations: CodeImplementation[];
}

const TopicDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('fromPath');

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Visualization State
  const [selectedLang, setSelectedLang] = useState('csharp');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [liveData, setLiveData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedStartNode, setSelectedStartNode] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(400);

  // Interactive Inputs State (Moved here to prevent reset on re-render)
  const [interVal, setInterVal] = useState<number>(10);
  const [interIdx, setInterIdx] = useState<number>(0);
  const [interSize, setInterSize] = useState<number>(5);

  useEffect(() => {
    document.title = topic ? `${topic.title} — DSA Visualizer` : 'Loading... — DSA Visualizer';
  }, [topic]);

  // Initialize live data based on topic
  useEffect(() => {
    if (!topic) return;
    if (topic.slug === 'binary-search') {
      const randomArr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 90) + 10);
      const sorted = randomArr.sort((a, b) => a - b);
      setLiveData(sorted);
    } else if (topic.slug.includes('linked')) {
      setLiveData([{ val: 10, id: 1 }, { val: 20, id: 2 }, { val: 30, id: 3 }]);
    } else if (topic.slug.includes('stack') || topic.slug.includes('queue')) {
    } else if (topic.slug.includes('tree')) {
      setLiveData([
        { id: 1, val: 50, x: 50, y: 10, left: 2, right: 3 },
        { id: 2, val: 30, x: 30, y: 40 },
        { id: 3, val: 70, x: 70, y: 40 }
      ]);
    } else if (topic.slug.includes('dfs') || topic.slug.includes('depth-first')) {
      setLiveData({
        nodes: [
          { id: 1, val: 50, x: 50, y: 15, state: 'unvisited' },
          { id: 2, val: 30, x: 30, y: 45, state: 'unvisited' },
          { id: 3, val: 70, x: 70, y: 45, state: 'unvisited' },
          { id: 4, val: 20, x: 15, y: 75, state: 'unvisited' },
          { id: 5, val: 40, x: 45, y: 75, state: 'unvisited' },
          { id: 6, val: 60, x: 55, y: 75, state: 'unvisited' },
          { id: 7, val: 80, x: 85, y: 75, state: 'unvisited' }
        ],
        edges: [
          { source: 1, target: 2, label: 'L', state: 'unvisited' },
          { source: 1, target: 3, label: 'R', state: 'unvisited' },
          { source: 2, target: 4, label: 'L', state: 'unvisited' },
          { source: 2, target: 5, label: 'R', state: 'unvisited' },
          { source: 3, target: 6, label: 'L', state: 'unvisited' },
          { source: 3, target: 7, label: 'R', state: 'unvisited' },
          { source: 5, target: 1, label: 'B', state: 'unvisited' } // Back edge to create cycle
        ]
      });
      setSelectedStartNode(null);
    } else if (topic.slug === 'array') {
      setLiveData([10, 20, 30, 40, 50]);
    } else if (topic.slug === 'bubble-sort' || topic.slug === 'insertion-sort' || topic.slug === 'selection-sort' || topic.slug === 'quick-sort') {
      setLiveData([64, 34, 25, 12, 22, 11, 90, 45]);
    } else if (topic.slug.includes('bfs') || topic.slug.includes('breadth-first')) {
      setLiveData({
        nodes: [
          { id: 1, val: 1, x: 50, y: 20, state: 'unvisited' },
          { id: 2, val: 2, x: 30, y: 45, state: 'unvisited' },
          { id: 3, val: 3, x: 70, y: 45, state: 'unvisited' },
          { id: 4, val: 4, x: 15, y: 75, state: 'unvisited' },
          { id: 5, val: 5, x: 45, y: 75, state: 'unvisited' },
          { id: 6, val: 6, x: 55, y: 75, state: 'unvisited' },
          { id: 7, val: 7, x: 85, y: 75, state: 'unvisited' }
        ],
        edges: [
          { source: 1, target: 2, state: 'unvisited' },
          { source: 1, target: 3, state: 'unvisited' },
          { source: 2, target: 4, state: 'unvisited' },
          { source: 2, target: 5, state: 'unvisited' },
          { source: 3, target: 6, state: 'unvisited' },
          { source: 3, target: 7, state: 'unvisited' },
          { source: 4, target: 5, state: 'unvisited' } // cycle
        ]
      });
      setSelectedStartNode(null);
    }
  }, [topic]);

  // --- INTERACTIVE ACTION GENERATORS ---
  const generateStepsForAction = (actionType: string, value?: any) => {
    stopPlayback();
    let newSteps: Step[] = [];

    // --- STACK: PUSH ---
    if (actionType === 'stack-push') {
      const val = value;
      const currentItems = [...(liveData || [])];
      newSteps.push({
        step: 1, line: 1,
        description: `Preparing to push ${val} onto the stack.`,
        state: { items: [...currentItems], type: 'stack' }
      });
      currentItems.push(val);
      newSteps.push({
        step: 2, line: 1,
        description: `${val} pushed to the top!`,
        state: { items: [...currentItems], type: 'stack', highlight: currentItems.length - 1 }
      });
      setLiveData(currentItems);
    }

    // --- STACK: POP ---
    if (actionType === 'stack-pop') {
      const currentItems = [...(liveData || [])];
      if (currentItems.length === 0) {
        alert("Stack Underflow!");
        return;
      }
      const popped = currentItems[currentItems.length - 1];
      newSteps.push({
        step: 1, line: 1,
        description: `Lifting the top element: ${popped}`,
        state: { items: [...currentItems], type: 'stack', highlight: currentItems.length - 1 }
      });
      currentItems.pop();
      newSteps.push({
        step: 2, line: 1,
        description: `Popped ${popped} from the stack.`,
        state: { items: [...currentItems], type: 'stack' }
      });
      setLiveData(currentItems);
    }

    // --- STACK: PEEK ---
    if (actionType === 'stack-peek') {
      const currentItems = [...(liveData || [])];
      if (currentItems.length === 0) return;
      newSteps.push({
        step: 1, line: 1,
        description: `Peeking top element: ${currentItems[currentItems.length - 1]}`,
        state: { items: [...currentItems], type: 'stack', highlight: currentItems.length - 1 }
      });
    }

    // --- QUEUE: ENQUEUE ---
    if (actionType === 'queue-enqueue') {
      const val = value;
      const currentItems = [...(liveData || [])];
      newSteps.push({
        step: 1, line: 1,
        description: `Enqueuing ${val} at the rear...`,
        state: { items: [...currentItems], type: 'queue' }
      });
      currentItems.push(val);
      newSteps.push({
        step: 2, line: 1,
        description: `${val} added to the queue.`,
        state: { items: [...currentItems], type: 'queue', highlight: currentItems.length - 1 }
      });
      setLiveData(currentItems);
    }

    // --- QUEUE: DEQUEUE ---
    if (actionType === 'queue-dequeue') {
      const currentItems = [...(liveData || [])];
      if (currentItems.length === 0) {
        alert("Queue Underflow!");
        return;
      }
      const dequeued = currentItems[0];
      newSteps.push({
        step: 1, line: 1,
        description: `Removing front element: ${dequeued}`,
        state: { items: [...currentItems], type: 'queue', highlight: 0 }
      });
      currentItems.shift();
      newSteps.push({
        step: 2, line: 1,
        description: `${dequeued} dequeued from the front.`,
        state: { items: [...currentItems], type: 'queue' }
      });
      setLiveData(currentItems);
    }

    // --- LINKED LIST: INSERT AT HEAD ---
    if (actionType === 'list-insert-head') {
      const val = value || Math.floor(Math.random() * 99) + 1;
      const nodes = [...(liveData || [])];
      const newNode = { val, id: Date.now() };
      newSteps.push({ step: 1, line: 1, description: `Creating new node with value ${val}`, state: { nodes: [newNode, ...nodes], type: 'linked-list', highlight: true } });
      setLiveData([newNode, ...nodes]);
    }

    // --- LINKED LIST: INSERT AT TAIL ---
    if (actionType === 'list-insert-tail') {
      const val = value || Math.floor(Math.random() * 99) + 1;
      const nodes = [...(liveData || [])];
      const newNode = { val, id: Date.now() };
      newSteps.push({ step: 1, line: 1, description: `Traversing to the end...`, state: { nodes: [...nodes], type: 'linked-list' } });
      newSteps.push({ step: 2, line: 1, description: `Appending ${val} at the tail.`, state: { nodes: [...nodes, newNode], type: 'linked-list', highlight: true } });
      setLiveData([...nodes, newNode]);
    }

    // --- LINKED LIST: INSERT AT INDEX ---
    if (actionType === 'list-insert-idx') {
      const { index, val } = value;
      const internalIdx = index - 1; // Convert 1-based to 0-based
      const nodes = [...(liveData || [])];
      const newNode = { val, id: Date.now() };
      if (internalIdx >= 0 && internalIdx <= nodes.length) {
        newSteps.push({ step: 1, line: 1, description: `Traversing to position ${index}...`, state: { nodes: [...nodes], type: 'linked-list' } });
        nodes.splice(internalIdx, 0, newNode);
        newSteps.push({ step: 2, line: 1, description: `Inserted ${val} at position ${index}.`, state: { nodes: [...nodes], type: 'linked-list', highlight: internalIdx } });
        setLiveData(nodes);
      }
    }

    // --- LINKED LIST: DELETE AT TAIL ---
    if (actionType === 'list-delete-tail') {
      const nodes = [...(liveData || [])];
      if (nodes.length === 0) return;
      newSteps.push({ step: 1, line: 1, description: `Traversing to the tail...`, state: { nodes: [...nodes], type: 'linked-list' } });
      newSteps.push({ step: 2, line: 1, description: `Removing tail node: ${nodes[nodes.length - 1].val}`, state: { nodes: [...nodes], type: 'linked-list', highlight: nodes.length - 1 } });
      nodes.pop();
      newSteps.push({ step: 3, line: 1, description: `Tail removed.`, state: { nodes: [...nodes], type: 'linked-list' } });
      setLiveData(nodes);
    }

    // --- LINKED LIST: DELETE AT INDEX ---
    if (actionType === 'list-delete-idx') {
      const index = value;
      const internalIdx = index - 1; // Convert 1-based to 0-based
      const nodes = [...(liveData || [])];
      if (internalIdx >= 0 && internalIdx < nodes.length) {
        newSteps.push({ step: 1, line: 1, description: `Traversing to position ${index}...`, state: { nodes: [...nodes], type: 'linked-list' } });
        newSteps.push({ step: 2, line: 1, description: `Removing node ${nodes[internalIdx].val} at position ${index}`, state: { nodes: [...nodes], type: 'linked-list', highlight: internalIdx } });
        const updatedNodes = nodes.filter((_, i) => i !== internalIdx);
        newSteps.push({ step: 3, line: 1, description: `Node removed.`, state: { nodes: updatedNodes, type: 'linked-list' } });
        setLiveData(updatedNodes);
      } else {
        alert("Position out of bounds");
        return;
      }
    }

    // --- LINKED LIST: DELETE AT HEAD ---
    if (actionType === 'list-delete-head') {
      const nodes = [...(liveData || [])];
      if (nodes.length === 0) return;
      newSteps.push({ step: 1, line: 1, description: `Removing head node: ${nodes[0].val}`, state: { nodes: [...nodes], type: 'linked-list', highlight: 0 } });
      nodes.shift();
      newSteps.push({ step: 2, line: 1, description: `Head removed.`, state: { nodes: [...nodes], type: 'linked-list' } });
      setLiveData(nodes);
    }

    // --- LINKED LIST: DELETE BY VALUE ---
    if (actionType === 'list-delete-val') {
      const target = value;
      const nodes = [...(liveData || [])];
      let foundIdx = nodes.findIndex(n => n.val === target);
      if (foundIdx !== -1) {
        newSteps.push({ step: 1, line: 1, description: `Searching for value ${target}...`, state: { nodes: [...nodes], type: 'linked-list' } });
        newSteps.push({ step: 2, line: 1, description: `Found ${target} at node ${foundIdx}. Removing...`, state: { nodes: [...nodes], type: 'linked-list', highlight: foundIdx } });
        nodes.splice(foundIdx, 1);
        newSteps.push({ step: 3, line: 1, description: `Node removed.`, state: { nodes: [...nodes], type: 'linked-list' } });
        setLiveData(nodes);
      }
    }
    // --- LINKED LIST: SEARCH ---
    if (actionType === 'list-search') {
      const target = value;
      const nodes = [...(liveData || [])];
      let found = false;
      for (let i = 0; i < nodes.length; i++) {
        newSteps.push({
          step: i + 1, line: 1,
          description: `Checking node ${i}: ${nodes[i].val}`,
          state: { nodes: nodes.map((n, idx) => ({ ...n, highlight: idx === i })), type: 'linked-list' }
        });
        if (nodes[i].val === target) {
          newSteps.push({
            step: i + 2, line: 1,
            description: `Found ${target}!`,
            state: { nodes: nodes.map((n, idx) => ({ ...n, highlight: idx === i })), type: 'linked-list' }
          });
          found = true;
          break;
        }
      }
      if (!found) newSteps.push({ step: nodes.length + 1, line: 1, description: `${target} not found.`, state: { nodes: [...nodes], type: 'linked-list' } });
    }

    // --- ARRAY: CREATE ---
    if (actionType === 'array-create') {
      const size = Math.min(value || 5, 15);
      const newArr = new Array(size).fill(0);
      setLiveData(newArr);
      newSteps.push({ step: 1, line: 1, description: `Created empty array of size ${size}.`, state: { array: newArr } });
    }

    // --- ARRAY: ADD / UPDATE ---
    if (actionType === 'array-update') {
      const { index, val } = value;
      const arr = [...(liveData || [])];
      if (index >= 0 && index <= arr.length) {
        newSteps.push({ step: 1, line: 1, description: `Updating position ${index} to ${val}...`, state: { array: [...arr], highlight: index } });
        arr[index] = val;
        newSteps.push({ step: 2, line: 1, description: `Updated!`, state: { array: [...arr], found: index } });
        setLiveData(arr);
      }
    }

    // --- ARRAY: REMOVE (SET TO 0) ---
    if (actionType === 'array-remove') {
      const index = value;
      const arr = [...(liveData || [])];
      if (index >= 0 && index < arr.length) {
        newSteps.push({ step: 1, line: 1, description: `Removing element at position ${index}...`, state: { array: [...arr], highlight: index } });
        arr[index] = 0;
        newSteps.push({ step: 2, line: 1, description: `Removed (Value set to 0).`, state: { array: [...arr], found: index } });
        setLiveData(arr);
      }
    }

    // --- ARRAY: SEARCH VALUE ---
    if (actionType === 'array-search') {
      const target = value;
      const arr = [...(liveData || [])];
      let stepCount = 1;
      let found = false;
      for (let i = 0; i < arr.length; i++) {
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Checking index ${i}: is ${arr[i]} == ${target}?`,
          state: { array: [...arr], highlight: i }
        });
        if (arr[i] === target) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Found ${target} at index ${i}! ✅`,
            state: { array: [...arr], found: i }
          });
          found = true;
          break;
        }
      }
      if (!found) {
        newSteps.push({
          step: stepCount++, line: 1,
          description: `${target} not found in array. ❌`,
          state: { array: [...arr] }
        });
      }
    }

    // --- ARRAY: BINARY SEARCH ---
    if (actionType === 'search-binary') {
      const target = value;
      const arr = [...(liveData || [])];
      let left = 0;
      let right = arr.length - 1;
      let stepCount = 1;
      let found = false;

      // Ensure array is sorted for binary search
      const sortedArr = [...arr].sort((a, b) => a - b);
      if (JSON.stringify(arr) !== JSON.stringify(sortedArr)) {
        newSteps.push({
          step: stepCount++, line: 1,
          description: "Sorting array for binary search...",
          state: { array: sortedArr, highlight: Array.from({ length: arr.length }, (_, i) => i) }
        });
        setLiveData(sortedArr);
      }

      const activeArr = JSON.stringify(arr) === JSON.stringify(sortedArr) ? arr : sortedArr;

      while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Range: [${left}, ${right}]. Middle at index ${mid} (value: ${activeArr[mid]})`,
          state: { array: [...activeArr], left, right, mid, highlight: mid }
        });

        if (activeArr[mid] === target) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Found ${target} at index ${mid}! ✅`,
            state: { array: [...activeArr], found: mid }
          });
          found = true;
          break;
        }

        if (activeArr[mid] < target) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `${activeArr[mid]} < ${target}. Ignoring the left half.`,
            state: { array: [...activeArr], left, right, highlight: mid, mid }
          });
          left = mid + 1;
        } else {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `${activeArr[mid]} > ${target}. Ignoring the right half.`,
            state: { array: [...activeArr], left, right, highlight: mid, mid }
          });
          right = mid - 1;
        }
      }

      if (!found) {
        newSteps.push({
          step: stepCount++, line: 1,
          description: `${target} not found in the array. ❌`,
          state: { array: [...activeArr], left, right }
        });
      }
    }
    // --- BST: INSERT ---
    const calculateTreeLayout = (nodesArr: any[]) => {
      if (!nodesArr || nodesArr.length === 0) return nodesArr;
      const getParent = (id: any) => nodesArr.find(n => n.left == id || n.right == id);
      let root = nodesArr[0];
      for (const node of nodesArr) {
        if (!getParent(node.id) && node.id != null) {
          root = node;
          break;
        }
      }

      if (!root) return nodesArr;

      let inorderIndex = 0;
      const levelHeight = 20;
      const totalNodes = nodesArr.length;

      const traverse = (nodeId: number | undefined, level: number) => {
        if (!nodeId) return;
        const node = nodesArr.find(n => n.id == nodeId);
        if (!node) return;

        traverse(node.left, level + 1);

        const x = ((inorderIndex + 1) / (totalNodes + 1)) * 100;
        const y = 15 + level * levelHeight;
        node.x = x;
        node.y = y;
        inorderIndex++;

        traverse(node.right, level + 1);
      };

      traverse(root.id, 0);
      return nodesArr;
    };

    // --- BST: INSERT ---
    if (actionType === 'bst-insert') {
      const val = value;
      let nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false }));
      let stepCount = 1;

      if (nodes.length === 0) {
        const root = { id: Date.now(), val };
        nodes.push(root);
        nodes = calculateTreeLayout(nodes);
        newSteps.push({ step: 1, line: 1, description: `Root is empty. Inserting ${val} as root.`, state: { nodes: [...nodes], type: 'tree' } });
      } else {
        const root = nodes.find(n => !nodes.some(p => p.left == n.id || p.right == n.id)) || nodes[0];
        let currId = root.id;
        let pathVisited = new Set<number>();

        while (currId) {
          let curr = nodes.find(n => n.id == currId);
          if (!curr) break;
          pathVisited.add(currId);

          if (val === curr.val) {
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Value ${val} already exists! BSTs do not allow duplicates. ❌`,
              state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id), highlight: n.id === currId }))]), type: 'tree' }
            });
            break; // Reject duplicate
          }

          newSteps.push({
            step: stepCount++, line: 1,
            description: `Comparing ${val} with ${curr.val}`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== currId, highlight: n.id === currId }))]), type: 'tree' }
          });

          if (val < curr.val) {
            if (!curr.left) {
              const newNodeId = Date.now();
              const newNode = { id: newNodeId, val };
              curr.left = newNodeId;
              nodes.push(newNode);
              nodes = calculateTreeLayout(nodes);
              newSteps.push({
                step: stepCount++, line: 1,
                description: `${val} < ${curr.val}. Inserting as left child. ✅`,
                state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id), found: n.id === newNodeId }))]), type: 'tree' }
              });
              break;
            }
            currId = curr.left;
          } else {
            if (!curr.right) {
              const newNodeId = Date.now();
              const newNode = { id: newNodeId, val };
              curr.right = newNodeId;
              nodes.push(newNode);
              nodes = calculateTreeLayout(nodes);
              newSteps.push({
                step: stepCount++, line: 1,
                description: `${val} > ${curr.val}. Inserting as right child. ✅`,
                state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id), found: n.id === newNodeId }))]), type: 'tree' }
              });
              break;
            }
            currId = curr.right;
          }
        }
      }
      setLiveData(nodes);
    }

    // --- BST: SEARCH ---
    if (actionType === 'bst-search') {
      const val = value;
      let nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false }));
      if (nodes.length === 0) return;
      const root = nodes.find(n => !nodes.some(p => p.left === n.id || p.right === n.id)) || nodes[0];
      let currId = root?.id;
      let stepCount = 1;
      let found = false;
      let pathVisited = new Set<number>();

      while (currId) {
        let curr = nodes.find(n => n.id === currId);
        if (!curr) break;
        pathVisited.add(currId);

        newSteps.push({
          step: stepCount++, line: 1,
          description: `Checking node ${curr.val}...`,
          state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== currId, highlight: n.id === currId }))]), type: 'tree' }
        });

        if (curr.val === val) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Found ${val}! ✅`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== currId, found: n.id === currId }))]), type: 'tree' }
          });
          found = true;
          break;
        }
        currId = val < curr.val ? curr.left : curr.right;
      }
      if (!found) newSteps.push({ step: stepCount++, line: 1, description: `${val} not found in tree. ❌`, state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) }))]), type: 'tree' } });
    }

    // --- BST: DELETE ---
    if (actionType === 'bst-delete') {
      const val = value;
      let nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false }));
      if (nodes.length === 0) return;
      const root = nodes.find(n => !nodes.some(p => p.left === n.id || p.right === n.id)) || nodes[0];
      let stepCount = 1;
      let pathVisited = new Set<number>();

      const deleteNode = (nodeId: number, parentId: number | null, isLeft: boolean): boolean => {
        let node = nodes.find(n => n.id === nodeId);
        if (!node) return false;
        pathVisited.add(nodeId);

        newSteps.push({
          step: stepCount++, line: 1,
          description: `Evaluating node ${node.val} for deletion...`,
          state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== nodeId, highlight: n.id === nodeId }))]), type: 'tree' }
        });

        if (val < node.val && node.left) return deleteNode(node.left, nodeId, true);
        if (val > node.val && node.right) return deleteNode(node.right, nodeId, false);
        if (val !== node.val) {
          // If we reach here, node was not found at leaf
          return false;
        }

        // Found node to delete
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Found node ${val} to delete. ✅`,
          state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== nodeId, found: n.id === nodeId }))]), type: 'tree' }
        });

        // Case 1: Leaf
        if (!node.left && !node.right) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Node is a leaf. Detaching from parent.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, highlight: n.id === nodeId }))]), type: 'tree' }
          });
          if (parentId !== null) {
            let parent = nodes.find(n => n.id == parentId)!;
            if (isLeft) delete parent.left;
            else delete parent.right;
          }
          nodes = nodes.filter(n => n.id !== nodeId);
        }
        // Case 2: One Child
        else if (!node.left || !node.right) {
          const childId = node.left || node.right;
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Node has one child. Bypassing node.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, highlight: n.id === nodeId }))]), type: 'tree' }
          });
          if (parentId !== null) {
            let parent = nodes.find(n => n.id == parentId)!;
            if (isLeft) parent.left = childId;
            else parent.right = childId;
          }
          nodes = nodes.filter(n => n.id !== nodeId);
        }
        // Case 3: Two Children
        else {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Node has two children. Finding inorder successor...`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, highlight: n.id === nodeId }))]), type: 'tree' }
          });
          // Find successor (min of right subtree)
          let succParentId = nodeId;
          let succId = node.right;
          let succ = nodes.find(n => n.id == succId)!;
          while (succ.left) {
            succParentId = succId;
            succId = succ.left;
            succ = nodes.find(n => n.id == succId)!;
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Traversing left to find minimum: ${succ.val}`,
              state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, highlight: n.id === succId }))]), type: 'tree' }
            });
          }
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Inorder successor found: ${succ.val}. Swapping values.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, found: n.id === succId || n.id === nodeId }))]), type: 'tree' }
          });

          node.val = succ.val;
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Values swapped. Now deleting the original successor node.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, found: n.id === succId }))]), type: 'tree' }
          });

          // Delete successor (which has at most one child)
          if (succParentId === nodeId) {
            node.right = succ.right;
          } else {
            let succParent = nodes.find(n => n.id == succParentId)!;
            succParent.left = succ.right;
          }
          nodes = nodes.filter(n => n.id !== succId);
        }

        newSteps.push({
          step: stepCount++, line: 1,
          description: `Deletion complete.`,
          state: { nodes: calculateTreeLayout([...nodes]), type: 'tree' }
        });
        return true;
      };

      if (root) {
        const found = deleteNode(root.id, null, false);
        if (!found) {
          newSteps.push({ step: stepCount++, line: 1, description: `${val} not found in tree. ❌`, state: { nodes: calculateTreeLayout([...nodes]), type: 'tree' } });
        }
      }
      setLiveData(nodes);
    }

    // --- BST: TRAVERSAL ---
    if (actionType === 'bst-traverse') {
      const mode = value; // 'inorder', 'preorder', 'postorder'
      const nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false }));
      if (nodes.length === 0) return;
      const root = nodes.find(n => !nodes.some(p => p.left === n.id || p.right === n.id)) || nodes[0];
      const result: number[] = [];
      let stepCount = 1;

      const traverse = (nodeId: number | undefined) => {
        if (!nodeId) return;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (mode === 'preorder') {
          result.push(node.val);
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Visiting ${node.val}`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === node.id }))]), type: 'tree', traversalResult: [...result] }
          });
        }

        traverse(node.left);

        if (mode === 'inorder') {
          result.push(node.val);
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Visiting ${node.val}`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === node.id }))]), type: 'tree', traversalResult: [...result] }
          });
        }

        traverse(node.right);

        if (mode === 'postorder') {
          result.push(node.val);
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Visiting ${node.val}`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === node.id }))]), type: 'tree', traversalResult: [...result] }
          });
        }
      };

      if (root) traverse(root.id);
      newSteps.push({ step: stepCount++, line: 1, description: `${mode.toUpperCase()} traversal complete. Result: [${result.join(', ')}]`, state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: true }))]), type: 'tree', traversalResult: [...result] } });
    }

    // --- GENERIC BINARY TREE: INSERT ---
    if (actionType === 'tree-insert') {
      const val = value;
      let nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false, deleted: false }));
      let stepCount = 1;

      if (nodes.length === 0) {
        const root = { id: Date.now(), val };
        nodes.push(root);
        nodes = calculateTreeLayout(nodes);
        newSteps.push({ step: 1, line: 1, description: `Tree is empty. Inserting ${val} as root.`, state: { nodes: [...nodes], type: 'tree' } });
      } else {
        const root = nodes.find(n => !nodes.some(p => p.left == n.id || p.right == n.id)) || nodes[0];

        // Level-order traversal to find first available spot
        let queue = [root.id];
        let foundSpot = false;
        let pathVisited = new Set<number>();

        while (queue.length > 0 && !foundSpot) {
          const currId = queue.shift()!;
          const curr = nodes.find(n => n.id === currId);
          if (!curr) continue;

          pathVisited.add(currId);
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Checking node ${curr.val} for available children slots...`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== currId, highlight: n.id === currId }))]), type: 'tree' }
          });

          if (!curr.left) {
            const newNodeId = Date.now();
            const newNode = { id: newNodeId, val };
            curr.left = newNodeId;
            nodes.push(newNode);
            nodes = calculateTreeLayout(nodes);
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Left child of ${curr.val} is empty. Inserting ${val} here. ✅`,
              state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id), found: n.id === newNodeId }))]), type: 'tree' }
            });
            foundSpot = true;
          } else {
            queue.push(curr.left);
            if (!curr.right) {
              const newNodeId = Date.now();
              const newNode = { id: newNodeId, val };
              curr.right = newNodeId;
              nodes.push(newNode);
              nodes = calculateTreeLayout(nodes);
              newSteps.push({
                step: stepCount++, line: 1,
                description: `Right child of ${curr.val} is empty. Inserting ${val} here. ✅`,
                state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id), found: n.id === newNodeId }))]), type: 'tree' }
              });
              foundSpot = true;
            } else {
              queue.push(curr.right);
            }
          }
        }
      }
      setLiveData(nodes);
    }

    // --- GENERIC BINARY TREE: DELETE ---
    if (actionType === 'tree-delete') {
      const val = value;
      let nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false, deleted: false }));
      if (nodes.length === 0) return;
      const root = nodes.find(n => !nodes.some(p => p.left === n.id || p.right === n.id)) || nodes[0];
      let stepCount = 1;

      // Level-order traversal to find the target node and the deepest rightmost node
      let targetNodeId: number | null = null;
      let deepestNodeId: number = root.id;
      let deepestParentId: number | null = null;
      let deepestIsLeft = false;

      // First pass: find target and find deepest rightmost
      let levelOrderNodes: { id: number, parentId: number | null, isLeft: boolean }[] = [];
      levelOrderNodes.push({ id: root.id, parentId: null, isLeft: false });
      let i = 0;
      while (i < levelOrderNodes.length) {
        let currId = levelOrderNodes[i].id;
        let curr = nodes.find(n => n.id === currId);
        if (curr) {
          if (curr.val === val && targetNodeId === null) targetNodeId = currId; // Find first occurrence

          if (curr.left) levelOrderNodes.push({ id: curr.left, parentId: currId, isLeft: true });
          if (curr.right) levelOrderNodes.push({ id: curr.right, parentId: currId, isLeft: false });
        }
        i++;
      }

      if (targetNodeId === null) {
        newSteps.push({ step: stepCount++, line: 1, description: `${val} not found in tree. ❌`, state: { nodes: calculateTreeLayout([...nodes]), type: 'tree' } });
      } else {
        let targetNode = nodes.find(n => n.id === targetNodeId)!;

        newSteps.push({
          step: stepCount++, line: 1,
          description: `Locating node ${val} to delete.`,
          state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, highlight: n.id === targetNodeId }))]), type: 'tree' }
        });

        // The last node in level order is the deepest rightmost node
        let lastEntry = levelOrderNodes[levelOrderNodes.length - 1];
        deepestNodeId = lastEntry.id;
        deepestParentId = lastEntry.parentId;
        deepestIsLeft = lastEntry.isLeft;

        let deepestNode = nodes.find(n => n.id === deepestNodeId)!;

        if (deepestNodeId === targetNodeId) {
          // Deleting the leaf itself
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Node ${val} is a leaf. Deleting it directly.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, deleted: n.id === targetNodeId }))]), type: 'tree' }
          });

          if (deepestParentId !== null) {
            let parent = nodes.find(n => n.id === deepestParentId)!;
            if (deepestIsLeft) delete parent.left;
            else delete parent.right;
          }
          nodes = nodes.filter(n => n.id !== targetNodeId);
        } else {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Finding deepest rightmost node (${deepestNode.val}) to replace deleted node.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, highlight: n.id === targetNodeId, visited: n.id === deepestNodeId }))]), type: 'tree' }
          });

          // Swap values
          targetNode.val = deepestNode.val;
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Replaced value with ${deepestNode.val}. Now deleting the deepest node.`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, found: n.id === targetNodeId, deleted: n.id === deepestNodeId }))]), type: 'tree' }
          });

          // Delete deepest leaf
          if (deepestParentId !== null) {
            let parent = nodes.find(n => n.id === deepestParentId)!;
            if (deepestIsLeft) delete parent.left;
            else delete parent.right;
          }
          nodes = nodes.filter(n => n.id !== deepestNodeId);
        }

        newSteps.push({
          step: stepCount++, line: 1,
          description: `Deletion complete.`,
          state: { nodes: calculateTreeLayout([...nodes]), type: 'tree' }
        });
      }
      setLiveData(nodes);
    }

    // --- GENERIC BINARY TREE: SEARCH ---
    if (actionType === 'tree-search') {
      const val = value;
      let nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false, deleted: false }));
      if (nodes.length === 0) return;
      const root = nodes.find(n => !nodes.some(p => p.left === n.id || p.right === n.id)) || nodes[0];
      let stepCount = 1;
      let found = false;

      let queue = [root.id];
      let pathVisited = new Set<number>();

      while (queue.length > 0) {
        let currId = queue.shift()!;
        let curr = nodes.find(n => n.id === currId);
        if (!curr) continue;
        pathVisited.add(currId);

        newSteps.push({
          step: stepCount++, line: 1,
          description: `Checking node ${curr.val}...`,
          state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== currId, highlight: n.id === currId }))]), type: 'tree' }
        });

        if (curr.val === val) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Found ${val}! ✅`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) && n.id !== currId, found: n.id === currId }))]), type: 'tree' }
          });
          found = true;
          break;
        }

        if (curr.left) queue.push(curr.left);
        if (curr.right) queue.push(curr.right);
      }

      if (!found) {
        newSteps.push({ step: stepCount++, line: 1, description: `${val} not found in tree. ❌`, state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: pathVisited.has(n.id) }))]), type: 'tree' } });
      }
    }

    // --- GENERIC BINARY TREE: TRAVERSAL ---
    if (actionType === 'tree-traverse') {
      const mode = value; // 'inorder', 'preorder', 'postorder', 'levelorder'
      const nodes = [...(liveData || [])].map(n => ({ ...n, highlight: false, found: false, visited: false, deleted: false }));
      if (nodes.length === 0) return;
      const root = nodes.find(n => !nodes.some(p => p.left === n.id || p.right === n.id)) || nodes[0];
      const result: number[] = [];
      let stepCount = 1;

      if (mode === 'levelorder') {
        let queue = [root.id];
        while (queue.length > 0) {
          let currId = queue.shift()!;
          let curr = nodes.find(n => n.id === currId);
          if (!curr) continue;

          result.push(curr.val);
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Visiting ${curr.val}`,
            state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === curr.id }))]), type: 'tree', traversalResult: [...result] }
          });

          if (curr.left) queue.push(curr.left);
          if (curr.right) queue.push(curr.right);
        }
      } else {
        // DFS Traversals
        const traverse = (nodeId: number | undefined) => {
          if (!nodeId) return;
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return;

          if (mode === 'preorder') {
            result.push(node.val);
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Visiting ${node.val}`,
              state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === node.id }))]), type: 'tree', traversalResult: [...result] }
            });
          }

          traverse(node.left);

          if (mode === 'inorder') {
            result.push(node.val);
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Visiting ${node.val}`,
              state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === node.id }))]), type: 'tree', traversalResult: [...result] }
            });
          }

          traverse(node.right);

          if (mode === 'postorder') {
            result.push(node.val);
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Visiting ${node.val}`,
              state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: result.includes(n.val), highlight: n.id === node.id }))]), type: 'tree', traversalResult: [...result] }
            });
          }
        };
        if (root) traverse(root.id);
      }

      newSteps.push({ step: stepCount++, line: 1, description: `${mode.toUpperCase()} traversal complete. Result: [${result.join(', ')}]`, state: { nodes: calculateTreeLayout([...nodes.map(n => ({ ...n, visited: true }))]), type: 'tree', traversalResult: [...result] } });
    }

    // --- GRAPH: DFS RUN ---
    if (actionType === 'dfs-run') {
      const startId = value;
      if (!startId) {
        alert("Please select a starting node by clicking on it.");
        return;
      }

      let nodes = [...(liveData.nodes || [])].map((n: any) => ({ ...n, state: 'unvisited', isStart: n.id === startId }));
      let edges = [...(liveData.edges || [])].map((e: any) => ({ ...e, state: 'unvisited' }));
      let stepCount = 1;
      let result: number[] = [];
      let visited = new Set<number>();
      let explored = new Set<number>();

      const dfs = (currId: number, parentId: number | null) => {
        visited.add(currId);
        let currNode = nodes.find(n => n.id === currId)!;
        result.push(currNode.val);

        nodes = nodes.map(n => n.id === currId ? { ...n, state: 'visiting' } : n);
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Visiting node ${currNode.val}.`,
          state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result] }
        });

        // get neighbors
        const neighborEdges = edges.filter(e => e.source === currId || e.target === currId);
        // Sort to ensure deterministic order (e.g. by neighbor value)
        const neighborNodes = neighborEdges.map(e => {
          const nId = e.source === currId ? e.target : e.source;
          return { nId, edge: e };
        }).sort((a, b) => nodes.find(n => n.id === a.nId)!.val - nodes.find(n => n.id === b.nId)!.val);

        for (const { nId, edge } of neighborNodes) {
          if (nId === parentId) continue;

          let neighborNode = nodes.find(n => n.id === nId)!;

          if (!visited.has(nId)) {
            edges = edges.map(e => (e.source === edge.source && e.target === edge.target) ? { ...e, state: 'tree' } : e);
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Node ${currNode.val} -> Found unvisited neighbor ${neighborNode.val}. Following tree edge.`,
              state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result] }
            });

            dfs(nId, currId);

            newSteps.push({
              step: stepCount++, line: 1,
              description: `Backtracking from ${neighborNode.val} to ${currNode.val}.`,
              state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result] }
            });
          } else if (!explored.has(nId)) {
            edges = edges.map(e => (e.source === edge.source && e.target === edge.target) ? { ...e, state: 'back' } : e);
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Node ${currNode.val} -> Found visited but unexplored neighbor ${neighborNode.val}. This is a back edge (cycle).`,
              state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result] }
            });
          }
        }

        explored.add(currId);
        nodes = nodes.map(n => n.id === currId ? { ...n, state: 'explored' } : n);
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Fully explored node ${currNode.val}.`,
          state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result] }
        });
      };

      dfs(startId, null);
      newSteps.push({
        step: stepCount++, line: 1,
        description: `DFS traversal complete!`,
        state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result] }
      });
      setLiveData({ nodes, edges });
    }

    if (actionType === 'dfs-reset') {
      let nodes = [...(liveData.nodes || [])].map((n: any) => ({ ...n, state: 'unvisited', isStart: false }));
      let edges = [...(liveData.edges || [])].map((e: any) => ({ ...e, state: 'unvisited' }));
      setSelectedStartNode(null);
      setLiveData({ nodes, edges });
      setSteps([]);
      return;
    }

    // --- GRAPH: BFS RUN ---
    if (actionType === 'bfs-run') {
      const startId = value;
      if (!startId) {
        alert("Please select a starting node by clicking on it.");
        return;
      }

      let nodes = [...(liveData.nodes || [])].map((n: any) => ({ ...n, state: 'unvisited', isStart: n.id === startId }));
      let edges = [...(liveData.edges || [])].map((e: any) => ({ ...e, state: 'unvisited' }));
      let stepCount = 1;
      let result: number[] = [];
      let visited = new Set<number>();

      let queue: number[] = [startId];
      visited.add(startId);

      let currentLevel = 0;
      let queueData = queue.map(id => nodes.find(n => n.id === id)!.val);

      nodes = nodes.map(n => n.id === startId ? { ...n, state: 'visiting' } : n);

      newSteps.push({
        step: stepCount++, line: 1,
        description: `Starting BFS at level 0. Enqueued start node ${nodes.find(n => n.id === startId)!.val}.`,
        state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
      });

      while (queue.length > 0) {
        let levelSize = queue.length;

        for (let i = 0; i < levelSize; i++) {
          let currId = queue.shift()!;
          queueData = queue.map(id => nodes.find(n => n.id === id)!.val);

          let currNode = nodes.find(n => n.id === currId)!;
          result.push(currNode.val);

          newSteps.push({
            step: stepCount++, line: 1,
            description: `Dequeued node ${currNode.val}. Exploring its neighbors.`,
            state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
          });

          // get neighbors
          const neighborEdges = edges.filter(e => e.source === currId || e.target === currId);
          // Sort to ensure deterministic order
          const neighborNodes = neighborEdges.map(e => {
            const nId = e.source === currId ? e.target : e.source;
            return { nId, edge: e };
          }).sort((a, b) => nodes.find(n => n.id === a.nId)!.val - nodes.find(n => n.id === b.nId)!.val);

          for (const { nId, edge } of neighborNodes) {
            let neighborNode = nodes.find(n => n.id === nId)!;

            if (!visited.has(nId)) {
              visited.add(nId);
              queue.push(nId);
              queueData = queue.map(id => nodes.find(n => n.id === id)!.val);

              edges = edges.map(e => (e.source === edge.source && e.target === edge.target) ? { ...e, state: 'tree' } : e);
              nodes = nodes.map(n => n.id === nId ? { ...n, state: 'visiting' } : n);

              newSteps.push({
                step: stepCount++, line: 1,
                description: `Node ${currNode.val} -> Found unvisited neighbor ${neighborNode.val}. Enqueuing and following tree edge.`,
                state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
              });
            } else {
              // check if edge is already processed
              let existingEdge = edges.find(e => e.source === edge.source && e.target === edge.target);
              if (existingEdge?.state === 'unvisited') {
                edges = edges.map(e => (e.source === edge.source && e.target === edge.target) ? { ...e, state: 'cross' } : e);
                newSteps.push({
                  step: stepCount++, line: 1,
                  description: `Node ${currNode.val} -> Neighbor ${neighborNode.val} is already visited/enqueued. Marking as cross edge.`,
                  state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
                });
              }
            }
          }

          nodes = nodes.map(n => n.id === currId ? { ...n, state: 'bfs-explored' } : n);
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Fully explored node ${currNode.val}.`,
            state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
          });
        }

        if (queue.length > 0) {
          currentLevel++;
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Moving to level ${currentLevel}.`,
            state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
          });
        }
      }

      newSteps.push({
        step: stepCount++, line: 1,
        description: `BFS traversal complete!`,
        state: { type: 'graph', nodes: [...nodes], edges: [...edges], traversalResult: [...result], queueData: [...queueData], currentLevel }
      });
      setLiveData({ nodes, edges });
    }

    if (actionType === 'bfs-reset') {
      let nodes = [...(liveData.nodes || [])].map((n: any) => ({ ...n, state: 'unvisited', isStart: false }));
      let edges = [...(liveData.edges || [])].map((e: any) => ({ ...e, state: 'unvisited' }));
      setSelectedStartNode(null);
      setLiveData({ nodes, edges });
      setSteps([]);
      return;
    }
    // --- SORT: BUBBLE SORT ---
    if (actionType === 'sort-bubble') {
      const arr = [...(liveData || [])];
      let stepCount = 1;
      let n = arr.length;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Comparing ${arr[j]} and ${arr[j + 1]}`,
            state: { array: [...arr], highlight: [j, j + 1] }
          });

          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            newSteps.push({
              step: stepCount++, line: 1,
              description: `Swapping ${arr[j + 1]} and ${arr[j]}`,
              state: { array: [...arr], highlight: [j, j + 1], swap: [j, j + 1] }
            });
          }
        }
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Element ${arr[n - i - 1]} is sorted.`,
          state: { array: [...arr], found: n - i - 1 }
        });
      }
      newSteps.push({ step: stepCount++, line: 1, description: `Sorted!`, state: { array: [...arr] } });
      // Do NOT call setLiveData here — liveData stays as the original so next sort run works correctly.
      // liveData will be synced to the sorted array after playback finishes (see useEffect below).
    }
    // --- SORT: INSERTION SORT ---
    if (actionType === 'sort-insertion') {
      const arr = [...(liveData || [])];
      let stepCount = 1;
      let n = arr.length;

      for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Picking ${key} at position ${i + 1} to insert into sorted sub-array.`,
          state: { array: [...arr], highlight: [i] }
        });

        while (j >= 0 && arr[j] > key) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `${arr[j]} > ${key}. Shifting ${arr[j]} to the right.`,
            state: { array: [...arr], highlight: [j], swap: [j, j + 1] }
          });
          arr[j + 1] = arr[j];
          j = j - 1;
        }
        arr[j + 1] = key;
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Inserted ${key} at position ${j + 2}.`,
          state: { array: [...arr], found: j + 1 }
        });
      }
      newSteps.push({ step: stepCount++, line: 1, description: `Array fully sorted!`, state: { array: [...arr] } });
      // Do NOT call setLiveData here — see comment above.
    }

    // --- SORT: SELECTION SORT ---
    if (actionType === 'sort-selection') {
      const arr = [...(liveData || [])];
      let stepCount = 1;
      let n = arr.length;

      for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Pass ${i + 1}: Assuming position ${i} (value ${arr[i]}) holds the minimum.`,
          state: { array: [...arr], highlight: i, left: i, right: n - 1 }
        });
        for (let j = i + 1; j < n; j++) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Comparing ${arr[j]} with current minimum ${arr[minIdx]}.`,
            state: { array: [...arr], highlight: j, mid: minIdx, left: i, right: n - 1 }
          });
          if (arr[j] < arr[minIdx]) {
            minIdx = j;
            newSteps.push({
              step: stepCount++, line: 1,
              description: `New minimum found: ${arr[minIdx]} at position ${minIdx}.`,
              state: { array: [...arr], highlight: minIdx, mid: minIdx, left: i, right: n - 1 }
            });
          }
        }
        if (minIdx !== i) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Swapping ${arr[i]} with minimum ${arr[minIdx]}.`,
            state: { array: [...arr], swap: [i, minIdx] }
          });
          [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Swapped. Position ${i} now holds ${arr[i]}.`,
            state: { array: [...arr], found: i }
          });
        } else {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `${arr[i]} is already the minimum. No swap needed.`,
            state: { array: [...arr], found: i }
          });
        }
      }
      newSteps.push({ step: stepCount++, line: 1, description: `Selection Sort complete!`, state: { array: [...arr] } });
    }

    // --- SORT: QUICK SORT ---
    if (actionType === 'sort-quick') {
      const arr = [...(liveData || [])];
      let stepCount = 1;

      const partition = (low: number, high: number) => {
        const pivot = arr[high];
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Pivot selected: ${pivot} at index ${high}.`,
          state: { array: [...arr], highlight: high, left: low, right: high }
        });
        let i = low - 1;
        for (let j = low; j < high; j++) {
          newSteps.push({
            step: stepCount++, line: 1,
            description: `Comparing ${arr[j]} with pivot ${pivot}.`,
            state: { array: [...arr], highlight: j, mid: high, left: low, right: high }
          });
          if (arr[j] <= pivot) {
            i++;
            if (i !== j) {
              newSteps.push({
                step: stepCount++, line: 1,
                description: `${arr[j]} <= ${pivot}. Swapping ${arr[i]} and ${arr[j]}.`,
                state: { array: [...arr], swap: [i, j], mid: high, left: low, right: high }
              });
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
          }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        newSteps.push({
          step: stepCount++, line: 1,
          description: `Placing pivot ${pivot} at its final position ${i + 1}.`,
          state: { array: [...arr], found: i + 1, left: low, right: high }
        });
        return i + 1;
      };

      const quickSort = (low: number, high: number) => {
        if (low < high) {
          const pi = partition(low, high);
          quickSort(low, pi - 1);
          quickSort(pi + 1, high);
        }
      };

      quickSort(0, arr.length - 1);
      newSteps.push({ step: stepCount++, line: 1, description: `Quick Sort complete!`, state: { array: [...arr] } });
    }

    if (newSteps.length > 0) {
      setSteps(newSteps);
      setCurrentStepIdx(0);
      setTimeout(() => setIsPlaying(true), 100);
    }
  };

  const stopPlayback = () => setIsPlaying(false);

  // Sync liveData to final sorted array after playback finishes
  useEffect(() => {
    if (!isPlaying && steps.length > 0 && currentStepIdx === steps.length - 1) {
      const lastStep = steps[steps.length - 1];
      if (lastStep?.state?.array && (topic?.slug === 'bubble-sort' || topic?.slug === 'insertion-sort' || topic?.slug === 'selection-sort' || topic?.slug === 'quick-sort')) {
        setLiveData(lastStep.state.array);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (playbackRef.current) clearInterval(playbackRef.current);
    }
    return () => { if (playbackRef.current) clearInterval(playbackRef.current); };
  }, [isPlaying, playbackSpeed]);

  const renderInteractionPanel = () => {
    const btnStyle = { padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '0.5rem', fontWeight: 600 };
    const inputStyle = { padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.8rem' };

    if (topic?.slug === 'array') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Size (Max 15)</span>
            <input type="number" style={{ ...inputStyle, width: '60px' }} value={interSize} onChange={e => setInterSize(parseInt(e.target.value))} />
          </div>
          <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('array-create', interSize)}>Create</button>
        </div>
        <div style={{ borderLeft: '1px solid var(--surface-border)', height: '20px', margin: '0 0.5rem' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Index</span>
            <input type="number" style={{ ...inputStyle, width: '60px' }} value={interIdx} onChange={e => setInterIdx(parseInt(e.target.value))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Value</span>
            <input type="number" style={{ ...inputStyle, width: '60px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
          </div>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('array-update', { index: interIdx, val: interVal })}>Add/Update</button>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('array-remove', interIdx)}>Remove</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('array-search', interVal)}>Search Value</button>
        </div>
      </div>
    );

    if (topic?.slug === 'linked-list') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Input Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Control Panel</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Value (Data)</span>
              <input type="number" style={{ ...inputStyle, width: '80px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Position (1-based)</span>
              <input type="number" style={{ ...inputStyle, width: '80px' }} value={interIdx} onChange={e => setInterIdx(parseInt(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Insertion Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Insertions</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('list-insert-head', interVal)}>Head</button>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('list-insert-tail', interVal)}>Tail</button>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('list-insert-idx', { index: interIdx, val: interVal })}>at Index</button>
          </div>
        </div>

        {/* Deletion Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Deletions</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('list-delete-head')}>Head</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('list-delete-tail')}>Tail</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('list-delete-idx', interIdx)}>at Index</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('list-delete-val', interVal)}>by Value</button>
          </div>
        </div>

        {/* Search & Reset Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Actions</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={{ ...btnStyle, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} onClick={() => generateStepsForAction('list-search', interVal)}>Search</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => { setLiveData([{ val: 10, id: 1 }, { val: 20, id: 2 }, { val: 30, id: 3 }]); setSteps([]); }}>Reset List</button>
          </div>
        </div>
      </div>
    );

    if (topic?.slug === 'binary-search') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Target Value</span>
            <input type="number" style={{ ...inputStyle, width: '100px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
          </div>
          <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('search-binary', interVal)}>Binary Search</button>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => {
            const unsorted = Array.from({ length: 10 }, () => Math.floor(Math.random() * 90) + 10);
            setLiveData(unsorted);
            setSteps([]);
          }}>New Random Array</button>
        </div>
      </div>
    );

    if (topic?.slug === 'stack') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Control Panel</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Value</span>
            <input type="number" style={{ ...inputStyle, width: '80px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('stack-push', interVal)}>Push</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('stack-pop')}>Pop</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('stack-peek')}>Peek</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Actions</span>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => { setLiveData([]); setSteps([]); }}>Clear Stack</button>
        </div>
      </div>
    );

    if (topic?.slug === 'queue') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Control Panel</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Value</span>
            <input type="number" style={{ ...inputStyle, width: '80px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('queue-enqueue', interVal)}>Enqueue</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('queue-dequeue')}>Dequeue</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Actions</span>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => { setLiveData([]); setSteps([]); }}>Clear Queue</button>
        </div>
      </div>
    );
    if (topic?.slug === 'bubble-sort' || topic?.slug === 'insertion-sort' || topic?.slug === 'selection-sort' || topic?.slug === 'quick-sort') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => {
              const action = topic?.slug === 'bubble-sort' ? 'sort-bubble'
                : topic?.slug === 'insertion-sort' ? 'sort-insertion'
                : topic?.slug === 'selection-sort' ? 'sort-selection'
                : 'sort-quick';
              generateStepsForAction(action);
            }}>Run Sort</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => {
              const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
              setLiveData(randomArr);
              setSteps([]);
              setCurrentStepIdx(0);
            }}>Generate Random Array</button>
          </div>
        </div>
      </div>
    );
    if (topic?.slug === 'binary-search-tree') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Control Panel</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Node Value</span>
            <input type="number" style={{ ...inputStyle, width: '100px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Node Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('bst-insert', interVal)}>Insert</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('bst-search', interVal)}>Search</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('bst-delete', interVal)}>Delete</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Traversals</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('bst-traverse', 'inorder')}>Inorder</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('bst-traverse', 'preorder')}>Preorder</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('bst-traverse', 'postorder')}>Postorder</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Actions</span>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => { setLiveData([]); setSteps([]); }}>Clear Tree</button>
        </div>
      </div>
    );

    if (topic?.slug === 'dfs' || topic?.slug === 'depth-first-search') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('dfs-run', selectedStartNode)}>Run DFS</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('dfs-reset')}>Reset Graph</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Animation Speed</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="range" min="100" max="1000" step="100" value={1100 - playbackSpeed} onChange={(e) => setPlaybackSpeed(1100 - parseInt(e.target.value))} style={{ width: '100px', accentColor: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '40px' }}>{playbackSpeed}ms</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Status</span>
          <span style={{ fontSize: '0.8rem', color: selectedStartNode ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {selectedStartNode ? `Start Node: ${liveData?.nodes?.find((n: any) => n.id === selectedStartNode)?.val}` : 'Click a node to set start'}
          </span>
        </div>
      </div>
    );

    if (topic?.slug === 'bfs' || topic?.slug === 'breadth-first-search') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('bfs-run', selectedStartNode)}>Run BFS</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('bfs-reset')}>Reset Graph</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Animation Speed</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="range" min="100" max="1000" step="100" value={1100 - playbackSpeed} onChange={(e) => setPlaybackSpeed(1100 - parseInt(e.target.value))} style={{ width: '100px', accentColor: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', width: '40px' }}>{playbackSpeed}ms</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Status</span>
          <span style={{ fontSize: '0.8rem', color: selectedStartNode ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {selectedStartNode ? `Start Node: ${liveData?.nodes?.find((n: any) => n.id === selectedStartNode)?.val}` : 'Click a node to set start'}
          </span>
        </div>
      </div>
    );

    if (topic?.slug === 'binary-tree') return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Control Panel</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Node Value</span>
            <input type="number" style={{ ...inputStyle, width: '100px' }} value={interVal} onChange={e => setInterVal(parseInt(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Node Operations</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={btnStyle} onClick={() => generateStepsForAction('tree-insert', interVal)}>Insert</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('tree-search', interVal)}>Search</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('tree-delete', interVal)}>Delete</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Traversals</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('tree-traverse', 'inorder')}>Inorder</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('tree-traverse', 'preorder')}>Preorder</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('tree-traverse', 'postorder')}>Postorder</button>
            <button className="btn btn-secondary" style={btnStyle} onClick={() => generateStepsForAction('tree-traverse', 'levelorder')}>Level-order</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Actions</span>
          <button className="btn btn-secondary" style={btnStyle} onClick={() => { setLiveData([]); setSteps([]); }}>Clear Tree</button>
        </div>
      </div>
    );

    return null;
  };

  const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(`topic-completed-${slug}`) === 'true');

  const editorRef = useRef<any>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await api.get(`/topics/${slug}`);
        setTopic(response.data);
      } catch (error) {
        console.error('Failed to fetch topic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
    return () => stopPlayback();
  }, [slug]);

  const currentImpl = topic?.codeImplementations.find(
    i => i.language.toLowerCase() === selectedLang.toLowerCase() ||
      (selectedLang === 'csharp' && i.language === '1') ||
      (selectedLang === 'cpp' && i.language === '2') ||
      (selectedLang === 'java' && i.language === '3') ||
      (selectedLang === 'javascript' && i.language === '4') ||
      (selectedLang === 'python' && i.language === '5')
  );

  const generateCodeForLang = (baseCode: string, lang: string): string => {
    if (!baseCode) return `// Implementation coming soon for ${lang}`;
    if (lang === 'csharp' || lang === '1') return baseCode;
    
    let code = baseCode;
    code = code.replace(/\/\/ C#/g, `// ${lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : lang === 'javascript' ? 'JavaScript' : 'Python'}`);
    
    if (lang === 'python' || lang === '5') {
      return code
        .replace(/int\[\] arr = \{ (.*?) \};/g, "arr = [$1]")
        .replace(/int target = (.*?);/g, "target = $1")
        .replace(/int (.*?);/g, "$1 = 0")
        .replace(/int (.*?) = (.*?);/g, "$1 = $2")
        .replace(/while \((.*?)\) \{/g, "while $1:")
        .replace(/for \(int i = 0; i < (.*?); i\+\+\) \{/g, "for i in range($1):")
        .replace(/for \(int j = 0; j < (.*?); j\+\+\) \{/g, "for j in range($1):")
        .replace(/for \(int i = 1; i < (.*?); \+\+i\) \{/g, "for i in range(1, $1):")
        .replace(/Console\.WriteLine\((.*?)\);/g, "print($1)")
        .replace(/curr != null/g, "curr is not None")
        .replace(/null/g, "None")
        .replace(/Queue<.*?> .*? = new Queue<.*?>\(\);/g, "from collections import deque\nq = deque()")
        .replace(/q\.Enqueue\((.*?)\);/g, "q.append($1)")
        .replace(/Node (.*?) = q\.Dequeue\(\);/g, "$1 = q.popleft()")
        .replace(/q\.Dequeue\(\)/g, "q.popleft()")
        .replace(/q\.Count > 0/g, "len(q) > 0")
        .replace(/Stack<.*?> .*? = new Stack<.*?>\(\);/g, "stack = []")
        .replace(/stack\.Push\((.*?)\);/g, "stack.append($1)")
        .replace(/int (.*?) = stack\.Pop\(\);/g, "$1 = stack.pop()")
        .replace(/stack\.Pop\(\)/g, "stack.pop()")
        .replace(/public class Node \{/g, "class Node:")
        .replace(/public int Value;/g, "    def __init__(self, value):\n        self.Value = value")
        .replace(/public Node Left, Right;/g, "        self.Left = None\n        self.Right = None")
        .replace(/;/g, "")
        .replace(/\{/g, "")
        .replace(/\}/g, "")
        .replace(/void (.*?)\((.*?)\)/g, "def $1($2):")
        .replace(/int\[\]/g, "list")
        .replace(/int /g, "")
        .replace(/Node /g, "");
    }
    
    if (lang === 'javascript' || lang === '4') {
      return code
        .replace(/int\[\] arr = \{ (.*?) \};/g, "let arr = [$1];")
        .replace(/int (.*?);/g, "let $1;")
        .replace(/int (.*?) = (.*?);/g, "let $1 = $2;")
        .replace(/Console\.WriteLine\((.*?)\);/g, "console.log($1);")
        .replace(/Queue<.*?> .*? = new Queue<.*?>\(\);/g, "let q = [];")
        .replace(/q\.Enqueue\((.*?)\);/g, "q.push($1);")
        .replace(/Node (.*?) = q\.Dequeue\(\);/g, "let $1 = q.shift();")
        .replace(/q\.Dequeue\(\)/g, "q.shift()")
        .replace(/q\.Count > 0/g, "q.length > 0")
        .replace(/Stack<.*?> .*? = new Stack<.*?>\(\);/g, "let stack = [];")
        .replace(/stack\.Push\((.*?)\);/g, "stack.push($1);")
        .replace(/int (.*?) = stack\.Pop\(\);/g, "let $1 = stack.pop();")
        .replace(/stack\.Pop\(\)/g, "stack.pop()")
        .replace(/public class Node \{/g, "class Node {")
        .replace(/public int Value;/g, "    constructor(value) { this.Value = value; }")
        .replace(/public Node Left, Right;/g, "")
        .replace(/void (.*?)\((.*?)\)/g, "function $1($2)")
        .replace(/Node /g, "let ")
        .replace(/int\[\] /g, "")
        .replace(/Queue<int> /g, "let ")
        .replace(/Stack<int> /g, "let ");
    }

    if (lang === 'cpp' || lang === '2') {
      return code
        .replace(/Console\.WriteLine\((.*?)\);/g, "cout << $1 << endl;")
        .replace(/null/g, "nullptr")
        .replace(/Queue<.*?> /g, "queue<int> ")
        .replace(/Stack<.*?> /g, "stack<int> ")
        .replace(/q\.Enqueue/g, "q.push")
        .replace(/q\.Dequeue\(\)/g, "q.front(); q.pop()")
        .replace(/stack\.Push/g, "stack.push")
        .replace(/stack\.Pop\(\)/g, "stack.top(); stack.pop()")
        .replace(/q\.Count > 0/g, "!q.empty()");
    }

    if (lang === 'java' || lang === '3') {
      return code
        .replace(/Console\.WriteLine\((.*?)\);/g, "System.out.println($1);")
        .replace(/Queue<.*?> /g, "Queue<Integer> ")
        .replace(/Stack<.*?> /g, "Stack<Integer> ")
        .replace(/q\.Enqueue/g, "q.add")
        .replace(/q\.Dequeue\(\)/g, "q.poll()")
        .replace(/stack\.Push/g, "stack.push")
        .replace(/stack\.Pop\(\)/g, "stack.pop()")
        .replace(/q\.Count > 0/g, "!q.isEmpty()");
    }
    
    return code;
  };

  const fallbackBaseCode = topic?.codeImplementations.find(i => i.language === '1' || i.language.toLowerCase() === 'csharp')?.code || '';
  const editorCode = currentImpl?.code || generateCodeForLang(fallbackBaseCode, selectedLang);

  // Sync implementation steps to state if not in interactive mode
  useEffect(() => {
    if (!currentImpl || !currentImpl.stepsJson) {
      // Try fallback if current has none
      const fallback = topic?.codeImplementations.find(i => {
        try { return JSON.parse(i.stepsJson || '[]').length > 0; } catch { return false; }
      });
      if (fallback) {
        setSteps(JSON.parse(fallback.stepsJson));
      } else {
        setSteps([]);
      }
      return;
    }
    try {
      const parsed = JSON.parse(currentImpl.stepsJson);
      setSteps(parsed);
    } catch {
      setSteps([]);
    }
  }, [currentImpl, topic]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    updateDecorations(0);
  };

  const updateDecorations = (stepIdx: number) => {
    if (!editorRef.current || !steps.length) return;

    const step = steps[stepIdx];
    if (!step || !step.line || step.line < 1) return;
    const decorations = [{
      range: { startLineNumber: step.line, startColumn: 1, endLineNumber: step.line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: 'monaco-line-highlight',
        glyphMarginClassName: 'monaco-glyph-arrow'
      }
    }];


    editorRef.current.deltaDecorations(editorRef.current._prevDecorations || [], decorations);
    editorRef.current._prevDecorations = editorRef.current.deltaDecorations(editorRef.current._prevDecorations || [], decorations);

    editorRef.current.revealLineInCenter(step.line);
  };

  useEffect(() => {
    updateDecorations(currentStepIdx);
  }, [currentStepIdx]);

  const nextStep = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      stopPlayback();
    }
  };

  const prevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const resetSteps = () => {
    stopPlayback();
    setCurrentStepIdx(0);
  };

  const togglePlayback = () => {
    setIsPlaying(prev => !prev);
  };

  const markAsCompleted = async () => {
    try {
      await api.post(`/topics/${slug}/complete`);
      setIsCompleted(true);
      localStorage.setItem(`topic-completed-${slug}`, 'true');
      
      if (fromPath) {
        navigate(`/paths/${fromPath}`);
      }
    } catch (error) {
      console.error('Failed to mark topic as completed:', error);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '80vh' }}><div className="text-gradient">Loading roadmap...</div></div>;
  if (!topic) return <div className="container">Topic not found.</div>;

  return (
    <div className="container" style={{ marginTop: '2rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={() => {
            if (fromPath) navigate(`/paths/${fromPath}`);
            else navigate('/topics');
          }} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
            <ChevronLeft size={18} /> {fromPath ? 'Back to Path' : 'Back to Topics'}
          </button>
          <h1 className="heading-lg" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{topic.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>{topic.categoryName} • {topic.difficulty}</p>
        </div>
        <button 
          onClick={markAsCompleted} 
          className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`} 
          style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            background: isCompleted ? '#10b981' : undefined, 
            color: isCompleted ? 'white' : undefined, 
            borderColor: isCompleted ? '#10b981' : undefined,
            opacity: isCompleted ? 0.9 : 1
          }}
        >
          {isCompleted ? <><CheckCircle size={18} /> {fromPath ? 'Continue Path' : 'Completed'}</> : <><CheckCircle size={18} /> Mark as Completed</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* TOP SECTION: Wide Visualizer */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="heading-lg" style={{ fontSize: '1.25rem', margin: 0 }}>Interactive Visualization</div>
            {renderInteractionPanel()}
          </div>

          <div className="visualizer-container" style={{ minHeight: '350px', width: '100%', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
            <Visualizer
              state={steps[currentStepIdx]?.state || (liveData ? { array: liveData, items: liveData, nodes: liveData.nodes || liveData, edges: liveData.edges, type: (topic.slug.includes('dfs') || topic.slug.includes('bfs') || topic.slug.includes('depth-first') || topic.slug.includes('breadth-first')) ? 'graph' : undefined } : null)}
              type={topic.slug.includes('sort') ? 'sort' : topic.slug.includes('tree') ? 'tree' : (topic.slug.includes('dfs') || topic.slug.includes('bfs') || topic.slug.includes('depth-first') || topic.slug.includes('breadth-first')) ? 'graph' : topic.slug.includes('search') ? 'array' : topic.slug.includes('stack') ? 'stack' : topic.slug.includes('queue') ? 'queue' : topic.slug.includes('linked') ? 'linked-list' : 'array'}
              onNodeClick={(id) => {
                if (topic.slug.includes('dfs') || topic.slug.includes('bfs') || topic.slug.includes('depth-first') || topic.slug.includes('breadth-first')) {
                  if (steps.length > 0) {
                    stopPlayback();
                    setSteps([]);
                    setCurrentStepIdx(0);
                    let nodes = [...(liveData.nodes || [])].map((n: any) => ({ ...n, state: 'unvisited', isStart: n.id === id }));
                    let edges = [...(liveData.edges || [])].map((e: any) => ({ ...e, state: 'unvisited' }));
                    setLiveData({ nodes, edges });
                    setSelectedStartNode(id);
                  } else {
                    setSelectedStartNode(id);
                    let nodes = [...(liveData.nodes || [])].map((n: any) => ({ ...n, isStart: n.id === id }));
                    setLiveData({ ...liveData, nodes });
                  }
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={resetSteps} className="btn btn-secondary" style={{ padding: '0.75rem' }} title="Reset">
              <RotateCcw size={20} />
            </button>
            <button onClick={prevStep} disabled={currentStepIdx === 0} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={togglePlayback} className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              {isPlaying ? 'Pause' : 'Auto Play'}
            </button>
            <button onClick={nextStep} disabled={currentStepIdx === steps.length - 1} className="btn btn-secondary" style={{ padding: '0.75rem' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </section>

        {/* BOTTOM SECTION: Two Columns (Explanation & Code) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          {/* Left: Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <section className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 className="heading-lg" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Info size={24} color="var(--primary-color)" />
                Overview
              </h2>
              <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                {topic.explanation || topic.description}
              </div>
            </section>

            <section className="glass-panel" style={{ padding: '2.5rem' }}>
              <h2 className="heading-lg" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={24} color="var(--secondary-color)" />
                Complexity Analysis
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>OPERATION</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>TIME</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>SPACE</th>
                  </tr>
                </thead>
                <tbody>
                  {topic.complexities.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{c.operationName}</td>
                      <td style={{ padding: '1rem' }}><code className="text-gradient" style={{ fontWeight: 700 }}>{c.timeComplexity}</code></td>
                      <td style={{ padding: '1rem' }}><code>{c.spaceComplexity}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Right: Code & Step Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="heading-lg" style={{ fontSize: '1.125rem', margin: 0 }}>Implementation</h2>
                <select
                  value={selectedLang}
                  onChange={(e) => { setSelectedLang(e.target.value); setCurrentStepIdx(0); stopPlayback(); }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="csharp" style={{ color: 'var(--surface-color)', background: '#fff' }}>C#</option>
                  <option value="cpp" style={{ color: 'var(--surface-color)', background: '#fff' }}>C++</option>
                  <option value="java" style={{ color: 'var(--surface-color)', background: '#fff' }}>Java</option>
                  <option value="javascript" style={{ color: 'var(--surface-color)', background: '#fff' }}>JavaScript</option>
                  <option value="python" style={{ color: 'var(--surface-color)', background: '#fff' }}>Python</option>
                </select>
              </div>

              <div style={{ height: '350px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                <Editor
                  height="100%"
                  language={selectedLang === 'javascript' ? 'javascript' : selectedLang === 'csharp' ? 'csharp' : selectedLang === 'cpp' ? 'cpp' : selectedLang}
                  theme="vs-dark"
                  value={editorCode}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    glyphMargin: true
                  }}
                />
              </div>

              <div style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '1rem', border: '1px solid rgba(99, 102, 241, 0.1)', minHeight: '100px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Step {currentStepIdx + 1} of {steps.length}
                </div>
                <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {steps[currentStepIdx]?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
