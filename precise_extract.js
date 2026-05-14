const fs = require('fs');

const content = fs.readFileSync('client/src/pages/TopicDetail.tsx', 'utf-8');

const hookStartStr = 'const generateStepsForAction = (actionType: string, value?: any) => {';
const hookEndStr = '  // Sync liveData to final sorted array after playback finishes';

const startIndex = content.indexOf(hookStartStr);
const endIndex = content.indexOf(hookEndStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Hook bounds not found!');
  process.exit(1);
}

// Find the end of stopPlayback
const stopPlaybackStr = 'const stopPlayback = () => setIsPlaying(false);';
const stopPlaybackEndIndex = content.indexOf(stopPlaybackStr) + stopPlaybackStr.length;

const hookCode = content.substring(startIndex, stopPlaybackEndIndex);

const newHookFile = `import { Step } from './useActionGenerator'; // we will define it here later
export interface Step {
  step: number;
  line: number;
  description: string;
  state?: any;
}

export const useActionGenerator = (liveData: any, setLiveData: any, setSteps: any, setCurrentStepIdx: any, setIsPlaying: any) => {
  ${hookCode}
  return { generateStepsForAction, stopPlayback };
};
`;

fs.writeFileSync('client/src/pages/topic-detail/useActionGenerator.ts', newHookFile);

const panelStartStr = 'const renderInteractionPanel = () => {';
const panelEndStr = 'const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(`topic-completed-${slug}`) === \'true\');';

const panelStartIndex = content.indexOf(panelStartStr);
const panelEndIndex = content.indexOf(panelEndStr);

if (panelStartIndex === -1 || panelEndIndex === -1) {
  console.log('Panel bounds not found!');
  process.exit(1);
}

const panelCode = content.substring(panelStartIndex, panelEndIndex).trim();
// Strip the wrapper
const strippedPanelCode = panelCode
  .replace('const renderInteractionPanel = () => {', 'export const InteractionPanel = ({ topic, interVal, setInterVal, interIdx, setInterIdx, generateStepsForAction, setLiveData, setSteps, setCurrentStepIdx, selectedStartNode, setSelectedStartNode, playbackSpeed, setPlaybackSpeed }: any) => {')
  .replace(/};\s*$/, '}');

const newPanelFile = `import React from 'react';\n\n${strippedPanelCode}\n`;

fs.writeFileSync('client/src/pages/topic-detail/InteractionPanel.tsx', newPanelFile);

// Now reconstruct TopicDetail.tsx
let newTopicDetail = content;
newTopicDetail = newTopicDetail.substring(0, startIndex) +
                 `const { generateStepsForAction, stopPlayback } = useActionGenerator(liveData, setLiveData, setSteps, setCurrentStepIdx, setIsPlaying);\n\n` +
                 newTopicDetail.substring(stopPlaybackEndIndex);

const renderPanelCall = `const renderInteractionPanel = () => {
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
  };`;

newTopicDetail = newTopicDetail.substring(0, newTopicDetail.indexOf(panelStartStr)) +
                 renderPanelCall + '\n\n  ' +
                 newTopicDetail.substring(panelEndIndex);

// Add imports
const imports = `import { useActionGenerator, Step } from './topic-detail/useActionGenerator';\nimport { InteractionPanel } from './topic-detail/InteractionPanel';\n`;
newTopicDetail = newTopicDetail.replace(`import Visualizer from './topic-detail/Visualizer';`, `import Visualizer from './topic-detail/Visualizer';\n${imports}`);

// Remove interface Step
newTopicDetail = newTopicDetail.replace(/interface Step \{\s*step: number;\s*line: number;\s*description: string;\s*state\?: any;\s*\}/, '');

fs.writeFileSync('client/src/pages/TopicDetail.tsx', newTopicDetail);
console.log('Refactoring complete!');
