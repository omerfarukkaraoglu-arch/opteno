import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export interface ViewModeToggleProps {
  mode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
  className?: string;
  gridLabel?: string;
  listLabel?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
  className = '',
  gridLabel = 'Kart',
  listLabel = 'Liste'
}) => {
  return (
    <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 ${className}`}>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
          mode === 'list'
            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700/80'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Liste Görünümü"
      >
        <List className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{listLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
          mode === 'grid'
            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700/80'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        title="Kart Görünümü"
      >
        <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{gridLabel}</span>
      </button>
    </div>
  );
};
