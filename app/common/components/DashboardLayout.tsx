import { useState } from "react";

import { ImageUploader } from "~/features/dashboard/components/ImageUploader";
import { ResultPanel } from "~/features/dashboard/components/ResultPanel";
import { Sidebar } from "~/features/dashboard/components/Sidebar";
import { MOCK_WORDS } from "~/mockData";
import type { DisplayOptions, JlptLevel, UploadedImage } from "~/types";

export function DashboardLayout() {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N3");
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showFurigana: true,
    showRomaji: false,
  });
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );

  return (
    <div className="bg-background-light text-text-primary font-display h-screen w-full overflow-hidden flex flex-col">
      <div className="flex flex-1 h-full w-full overflow-hidden">
        <Sidebar
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          displayOptions={displayOptions}
          onDisplayOptionsChange={setDisplayOptions}
        />
        <ImageUploader
          uploadedImage={uploadedImage}
          onImageUpload={setUploadedImage}
        />
        <ResultPanel words={MOCK_WORDS} displayOptions={displayOptions} />
      </div>
    </div>
  );
}
