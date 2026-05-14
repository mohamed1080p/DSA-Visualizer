const fs = require('fs');
const content = fs.readFileSync('client/src/pages/TopicDetail.tsx', 'utf-8');

const hookStartStr = 'const generateStepsForAction = (actionType: string, value?: any) => {';
const stopPlaybackStr = 'const stopPlayback = () => setIsPlaying(false);';

const startIndex = content.indexOf(hookStartStr);
const stopPlaybackEndIndex = content.indexOf(stopPlaybackStr) + stopPlaybackStr.length;

const hookCode = content.substring(startIndex, stopPlaybackEndIndex);

const panelStartStr = 'const renderInteractionPanel = () => {';
const panelEndStr = '  const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(`topic-completed-${slug}`) === \'true\');';

const panelStartIndex = content.indexOf(panelStartStr);
const panelEndIndex = content.indexOf(panelEndStr);

const panelCode = content.substring(panelStartIndex, panelEndIndex).trim();

// Now construct final TopicDetail.tsx
let part1 = content.substring(0, startIndex);
let part2 = content.substring(stopPlaybackEndIndex, panelStartIndex);
let part3 = content.substring(panelEndIndex);

const replacementHook = `const { generateStepsForAction, stopPlayback } = useActionGenerator(liveData, setLiveData, setSteps, setCurrentStepIdx, setIsPlaying);`;

const replacementPanel = `const renderInteractionPanel = () => {
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

let newTopicDetail = part1 + replacementHook + part2 + replacementPanel + '\n' + part3;

const imports = `import { useActionGenerator, Step } from './topic-detail/useActionGenerator';\nimport { InteractionPanel } from './topic-detail/InteractionPanel';\n`;
newTopicDetail = newTopicDetail.replace(`import Visualizer from './topic-detail/Visualizer';`, `import Visualizer from './topic-detail/Visualizer';\n${imports}`);

newTopicDetail = newTopicDetail.replace(/interface Step \{\s*step: number;\s*line: number;\s*description: string;\s*state\?: any;\s*\}/, '');

fs.writeFileSync('client/src/pages/TopicDetail.tsx', newTopicDetail);
console.log('Done fixing TopicDetail.tsx');
