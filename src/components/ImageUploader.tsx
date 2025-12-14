import { Bell, CheckCircle, CloudUpload, HelpCircle, Home, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useCallback } from "react";

import type { UploadedImage } from "../types";

interface ImageUploaderProps {
  uploadedImage: UploadedImage | null;
  onImageUpload: (image: UploadedImage | null) => void;
}

export function ImageUploader({ uploadedImage, onImageUpload }: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        console.log("Uploaded file:", file);

        const preview = URL.createObjectURL(file);
        onImageUpload({ file, preview });
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleRemoveImage = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    onImageUpload(null);
  };

  return (
    <main className="flex-1 flex flex-col bg-background-light relative overflow-hidden min-w-0">
      <div className="h-16 flex items-center justify-between px-8 bg-white shrink-0">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Home className="w-4 h-4" />
          <span>/</span>
          <span className="text-text-primary font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-text-secondary hover:text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="text-text-secondary hover:text-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto bg-background-light">
        <div className="w-full max-w-3xl h-full max-h-[600px] flex flex-col">
          {uploadedImage ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 rounded-3xl bg-white px-6 py-14 relative overflow-hidden">
              <button
                onClick={handleRemoveImage}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-5 h-5 text-text-primary" />
              </button>
              <img
                src={uploadedImage.preview}
                alt="Uploaded preview"
                className="max-w-full max-h-[500px] object-contain rounded-lg"
              />
              <p className="text-text-secondary text-sm">
                {uploadedImage.file.name} ({(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`flex-1 flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed bg-white px-6 py-14 transition-all cursor-pointer group relative overflow-hidden ${
                isDragActive
                  ? "border-primary bg-gray-50"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="z-10 flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-surface-highlight flex items-center justify-center text-text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                  <CloudUpload className="w-10 h-10" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-text-primary text-xl font-bold leading-tight tracking-tight text-center">
                    {isDragActive ? "이미지를 여기에 놓으세요" : "이미지를 드래그 앤 드롭하세요"}
                  </p>
                  <p className="text-text-secondary text-sm font-normal text-center">
                    JPG, PNG, WEBP 지원 (최대 5MB)
                  </p>
                </div>
                <button className="mt-4 flex min-w-[140px] items-center justify-center rounded-full h-11 px-6 bg-primary hover:bg-gray-800 text-white text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-xl">
                  <span>파일 선택</span>
                </button>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-8 text-text-secondary text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-text-primary w-5 h-5" />
              <span>고정밀 OCR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-text-primary w-5 h-5" />
              <span>자동 번역</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
