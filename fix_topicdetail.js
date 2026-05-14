const fs = require('fs');

// Read the original file
const originalLines = fs.readFileSync('client/src/pages/TopicDetail.tsx.backup', 'utf-8').split('\n');

const beforeActionGen = originalLines.slice(0, 135).join('\n');
const afterActionGen = originalLines.slice(1448, 1474).join('\n'); // 1448 to 1473
const afterPanel = originalLines.slice(1769).join('\n');

const imports = `import { useActionGenerator, Step } from './topic-detail/useActionGenerator';\nimport { InteractionPanel } from './topic-detail/InteractionPanel';\n`;

// Insert the imports right after the first imports
const modifiedBefore = beforeActionGen.replace(`import Visualizer from './topic-detail/Visualizer';`, `import Visualizer from './topic-detail/Visualizer';\n${imports}`);

// Remove the `interface Step` definition from TopicDetail since we moved it to useActionGenerator.ts
// The interface Step spans lines 20-25
// But wait, it's easier to just do a string replacement.
let finalBefore = modifiedBefore.replace(`interface Step {\r
  step: number;\r
  line: number;\r
  description: string;\r
  state?: any;\r
}`, '');

finalBefore = finalBefore.replace(`interface Step {\n  step: number;\n  line: number;\n  description: string;\n  state?: any;\n}`, '');


const newTopicDetail = `${finalBefore}
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
console.log("Fixed TopicDetail.tsx");
