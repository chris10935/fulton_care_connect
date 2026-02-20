import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';

interface FilterSidebarProps {
  onFilterChange: (filters: MapFilters) => void;
  resultCount: number;
  isMobile?: boolean;
  onClose?: () => void;
}

export interface MapFilters {
  city: string;
  categories: string[];
  keyword: string;
  source: string;
}

const SOURCES = ['SKYE', 'FACAA', 'DFCS', 'Fulton Services', 'All'];

export function MapFilterSidebar({
  onFilterChange,
  resultCount,
  isMobile = false,
  onClose,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<MapFilters>({
    city: '',
    categories: [],
    keyword: '',
    source: '',
  });
  const [keywordDebounce, setKeywordDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (keywordDebounce) {
      clearTimeout(keywordDebounce);
    }

    const timeout = setTimeout(() => {
      onFilterChange(filters);
    }, 300);

    setKeywordDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [filters.city, filters.categories, filters.keyword, filters.source]);

  const handleCityChange = (value: string) => {
    setFilters({ ...filters, city: value });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    setFilters({ ...filters, categories: newCategories });
  };

  const handleClearFilters = () => {
    setFilters({
      city: '',
      categories: [],
      keyword: '',
      source: '',
    });
  };

  return (
    <div className="bg-white shadow-lg p-3 sm:p-4 flex-1 overflow-y-auto overscroll-contain">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#2563eb]" />
          <h2 className="font-bold text-base sm:text-lg text-gray-900">Filters</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-3 p-2.5 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900">
          Showing <strong>{resultCount}</strong> resources
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            City
          </label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="Enter city (e.g., Atlanta)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Categories
          </label>
          <div className="space-y-1 max-h-40 sm:max-h-48 overflow-y-auto overscroll-contain border border-gray-100 rounded-lg p-1">
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 p-1.5 sm:p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-[#2563eb] border-gray-300 rounded focus:ring-[#2563eb] shrink-0"
                />
                <span className="text-sm text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Name or Keyword
          </label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            placeholder="Search by name, service, or category"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-sm"
          >
            <option value="">All Sources</option>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClearFilters}
          className="w-full px-4 py-2 text-sm font-medium text-[#2563eb] hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors border border-[#2563eb]"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
