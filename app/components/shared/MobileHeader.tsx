import { useNavigate } from "react-router";

import { ChevronLeft, Menu } from "lucide-react";

interface IMobileHeaderProps {
  title?: string;
  onMenuClick: () => void;
}

export function MobileHeader({
  title = "Snap Voca",
  onMenuClick,
}: IMobileHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="md:hidden h-14 flex items-center justify-between px-4 bg-surface-dark border-b border-border-color shrink-0">
      <button
        onClick={handleBack}
        className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-text-primary" />
      </button>

      <h1 className="text-lg font-bold text-text-primary">{title}</h1>

      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
      >
        <Menu className="w-6 h-6 text-text-primary" />
      </button>
    </header>
  );
}
