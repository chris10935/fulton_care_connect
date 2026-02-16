import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { FULTON_ZIP_CODES, CATEGORIES } from '../lib/constants';

interface FilterSidebarProps {
  onFilterChange: (filters: MapFilters) => void;
  resultCount: number;
  isMobile?: boolean;
  onClose?: () => void;
}

export interface MapFilters {
  zipCode: string;
  categories: string[];
  keyword: string;
  source: string;
}

const SOURCES = ['SKYE', 'FACAA', 'DFCS', 'All'];

export function MapFilterSidebar({
  onFilterChange,
  resultCount,
  isMobile = false,
  onClose,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<MapFilters>({
    zipCode: '',
    categories: [],
    keyword: '',
    source: '',
  });

  const [zipError, setZipError] = useState('');
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
  }, [filters.zipCode, filters.categories, filters.keyword, filters.source]);

  const handleZipChange = (value: string) => {
    setFilters({ ...filters, zipCode: value });
    if (value && !FULTON_ZIP_CODES.includes(value)) {
      setZipError('Invalid Fulton County ZIP code');
    } else {
      setZipError('');
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    setFilters({ ...filters, categories: newCategories });
  };

  const handleClearFilters = () => {
    setFilters({
      zipCode: '',
      categories: [],
      keyword: '',
      source: '',
    });
    setZipError('');
  };

  return (
    <div className={`bg-white ${isMobile ? 'rounded-t-lg' : 'rounded-lg'} shadow-lg p-4 h-full overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#2563eb]" />
          <h2 className="font-bold text-lg text-gray-900">Filters</h2>
        </div>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900">
          Showing <strong>{resultCount}</strong> resources
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={filters.zipCode}
            onChange={(e) => handleZipChange(e.target.value)}
            placeholder="Enter ZIP code"
            maxLength={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent text-sm"
          />
          {zipError && <p className="text-red-600 text-xs mt-1">{zipError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-[#2563eb] border-gray-300 rounded focus:ring-[#2563eb]"
                />
                <span className="text-sm text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          className="w-full px-4 py-2 text-sm font-medium text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors border border-[#2563eb]"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
