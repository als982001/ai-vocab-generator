import { Menu, MoreVertical } from "lucide-react";

interface IMobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: IMobileHeaderProps) {
  return (
    <header className="md:hidden h-14 flex items-center justify-between px-4 bg-surface-dark border-b border-border-color shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
      >
        <Menu className="w-6 h-6 text-text-primary" />
      </button>

      <h1 className="text-lg font-bold text-text-primary">Snap Voca</h1>

      <button className="p-2 rounded-lg hover:bg-surface-highlight transition-colors">
        <MoreVertical className="w-6 h-6 text-text-primary" />
      </button>
    </header>
  );
}
