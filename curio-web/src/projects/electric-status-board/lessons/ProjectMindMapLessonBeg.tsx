
"use client";

import { ProjectMindmap } from "@/src/lesson-core/projectMindMap";


import {
  mindmapNodes,
  buttonBehaviors,
  projectOverview,
  nodePositions,
} from "@/src/projects/electric-status-board/assets/mindMapBeg";

export default function ESBProjectMindMapLesson(props: {
  onBack?: () => void;
  onContinue?: () => void;
  embedded?: boolean;
}) {
  return (
    <ProjectMindmap
      onBack={props.onBack}
      onContinue={props.onContinue}
      //embedded={props.embedded}
      mindmapNodes={mindmapNodes}
      buttonBehaviors={buttonBehaviors}
      projectOverview={projectOverview}
      positions={nodePositions}
      hubId="main-menu"
    />
  );
}
