const fs = require('fs');
const lines = fs.readFileSync('client/src/pages/TopicDetail.tsx', 'utf-8').split('\n');

const actionGenLines = lines.slice(135, 1448).join('\n');
const actionGenCode = `export interface Step {
  step: number;
  line: number;
  description: string;
  state?: any;
}

export const useActionGenerator = (liveData: any, setLiveData: any, setSteps: any, setCurrentStepIdx: any, setIsPlaying: any) => {
${actionGenLines}
  return { generateStepsForAction, stopPlayback };
};
`;
fs.writeFileSync('client/src/pages/topic-detail/useActionGenerator.ts', actionGenCode);

const panelLines = lines.slice(1475, 1769).join('\n');
const panelCode = `import React from 'react';

export const InteractionPanel = ({ topic, interVal, setInterVal, interIdx, setInterIdx, generateStepsForAction, setLiveData, setSteps, setCurrentStepIdx, selectedStartNode, setSelectedStartNode, playbackSpeed, setPlaybackSpeed }: any) => {
  const inputStyle = { padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s ease', fontSize: '0.85rem' };
  const btnStyle = { padding: '0.4rem 0.8rem', fontSize: '0.8rem' };
${panelLines}
`;
fs.writeFileSync('client/src/pages/topic-detail/InteractionPanel.tsx', panelCode);

// Rewrite TopicDetail.tsx
const beforeActionGen = lines.slice(0, 135).join('\n');
const afterActionGen = lines.slice(1448, 1474).join('\n'); // 1448 to 1473 is the gap between actionGen and panel
const afterPanel = lines.slice(1769).join('\n');

const newTopicDetail = `${beforeActionGen}
  const { generateStepsForAction, stopPlayback } = useActionGenerator(liveData, setLiveData, setSteps, setCurrentStepIdx, setIsPlaying);

${afterActionGen}
  const renderInteractionPanel = () => {
    return <InteractionPanel
      topic={topic}
      interVal={interVal} setInterVal={setInterVal}
      interIdx={interIdx} setInterIdx={setInterIdx}
      generateStepsForAction={generateStepsForAction}
      setLiveData={setLiveData}
      setSteps={setSteps}
      setCurrentStepIdx={setCurrentStepIdx}
      selectedStartNode={selectedStartNode} setSelectedStartNode={setSelectedStartNode}
      playbackSpeed={playbackSpeed} setPlaybackSpeed={setPlaybackSpeed}
    />;
  };
${afterPanel}`;

fs.writeFileSync('client/src/pages/TopicDetail.tsx', newTopicDetail);
console.log("Extraction complete.");
