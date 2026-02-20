import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, Globe, Clock, Map as MapIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../lib/constants';
import { logSearch } from '../lib/analytics';
import type { Resource } from '../lib/types';

export function Directory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    keyword: searchParams.get('keyword') || '',
  });

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    try {
      setLoading(true);
      let query = supabase.from('resources').select('*').order('name');

      const { data, error } = await query;

      if (error) throw error;

      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    logSearch(undefined, filters.category, filters.keyword);
    fetchResources();
  }

  const filteredResources = resources.filter((resource) => {
    if (filters.category && resource.category !== filters.category) {
      return false;
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      return (
        resource.name.toLowerCase().includes(keyword) ||
        resource.services?.toLowerCase().includes(keyword) ||
        resource.category?.toLowerCase().includes(keyword)
      );
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Resource Directory</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keyword
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Search by name or service"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Apply Filters
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Found <strong>{filteredResources.length}</strong> resources
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/map')}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#2563eb] text-white hover:bg-[#1d4ed8] flex items-center gap-2"
            >
              <MapIcon className="w-5 h-5" />
              <span className="hidden sm:inline">View Map</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
          <p className="mt-4 text-gray-600">Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">No resources found matching your criteria.</p>
          <button
            onClick={() => {
              setFilters({ category: '', keyword: '' });
              fetchResources();
            }}
            className="mt-4 text-[#2563eb] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              onClick={() => navigate(`/resource/${resource.id}`)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
                {resource.category && (
                  <span className="px-3 py-1 bg-[#2563eb]/10 text-[#2563eb] rounded-full text-sm font-medium">
                    {CATEGORIES.find((c) => c.id === resource.category)?.label || resource.category}
                  </span>
                )}
              </div>

              {resource.services && (
                <p className="text-gray-600 mb-4 line-clamp-2">{resource.services}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {resource.address && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{resource.address}</span>
                  </div>
                )}

                {resource.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{resource.phone}</span>
                  </div>
                )}

                {resource.hours && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{resource.hours}</span>
                  </div>
                )}

                {resource.website && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{resource.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
