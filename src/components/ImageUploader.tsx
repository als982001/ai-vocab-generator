import { Bell, CheckCircle, CloudUpload, HelpCircle, Home } from "lucide-react";

export function ImageUploader() {
  return (
    <main className="flex-1 flex flex-col bg-white relative overflow-hidden min-w-0">
      <div className="h-16 border-b border-border-color flex items-center justify-between px-8 bg-white shrink-0">
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
          <div className="flex-1 flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed border-border-color bg-white px-6 py-14 hover:border-primary transition-colors cursor-pointer group relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="z-10 flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-surface-highlight flex items-center justify-center text-text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                <CloudUpload className="w-10 h-10" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-text-primary text-xl font-bold leading-tight tracking-tight text-center">
                  Drag &amp; Drop Image Here
                </p>
                <p className="text-text-secondary text-sm font-normal text-center">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>
              <button className="mt-4 flex min-w-[140px] items-center justify-center rounded-full h-11 px-6 bg-primary hover:bg-gray-800 text-white text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-xl">
                <span>Browse Files</span>
              </button>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-8 text-text-secondary text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-text-primary w-5 h-5" />
              <span>High Accuracy OCR</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-text-primary w-5 h-5" />
              <span>Auto-Translation</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
