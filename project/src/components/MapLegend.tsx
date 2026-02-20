import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';

export function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between md:pointer-events-none"
      >
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Legend</h3>
        <span className="md:hidden text-gray-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      <div className={`${expanded ? 'max-h-96' : 'max-h-0 md:max-h-96'} transition-all duration-200 overflow-hidden`}>
        <div className="space-y-1.5 pt-2">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0"
                style={{
                  backgroundColor: CATEGORY_COLORS[category.id] || CATEGORY_COLORS.default,
                }}
              />
              <span className="text-xs sm:text-sm text-gray-700">{category.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
