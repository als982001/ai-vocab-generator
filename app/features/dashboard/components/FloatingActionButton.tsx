import { useRef } from "react";

import { Plus } from "lucide-react";
import type { IUploadedImage } from "~/types";

interface IFloatingActionButtonProps {
  onImageUpload: (image: IUploadedImage) => void;
}

export function FloatingActionButton({
  onImageUpload,
}: IFloatingActionButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const preview = URL.createObjectURL(file);
      onImageUpload({ file, preview });
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleClick}
        className="md:hidden fixed bottom-8 right-6 w-14 h-14 rounded-full bg-primary hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
        aria-label="새 이미지 추가"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
