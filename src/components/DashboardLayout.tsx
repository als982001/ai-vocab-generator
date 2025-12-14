import { useState } from "react";

import { MOCK_WORDS } from "../mockData";
import type { DisplayOptions, JlptLevel } from "../types";
import { ImageUploader } from "./ImageUploader";
import { ResultPanel } from "./ResultPanel";
import { Sidebar } from "./Sidebar";

export function DashboardLayout() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });

  return (
    <div className="bg-background-dark text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <div className="flex flex-1 h-full w-full overflow-hidden">
        <Sidebar
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
        />
        <ImageUploader />
        <ResultPanel words={MOCK_WORDS} displayOptions={displayOptions} />
      </div>
    </div>
  );
}
