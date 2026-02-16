import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Menu, X, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { logViewMap, logClickMarker, logFilterMap } from '../lib/analytics';
import { MAP_CENTER, MAP_ZOOM, CATEGORY_COLORS, FULTON_ZIP_CODES } from '../lib/constants';
import { MapFilterSidebar, MapFilters } from '../components/MapFilterSidebar';
import { MapLegend } from '../components/MapLegend';
import type { Resource } from '../lib/types';

function createCustomIcon(color: string): L.Icon {
  const svgIcon = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2C11.03 2 7 6.03 7 11c0 7 9 17 9 17s9-10 9-17c0-4.97-4.03-9-9-9z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="11" r="4" fill="white"/>
    </svg>
  `;

  return L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function MapBoundsHandler({ resources }: { resources: Resource[] }) {
  const map = useMap();

  useEffect(() => {
    if (resources.length > 0) {
      const validPoints = resources
        .filter((r) => r.lat && r.lng)
        .map((r) => [r.lat!, r.lng!] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [resources, map]);

  return null;
}

export function Map() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({
    zipCode: '',
    categories: [],
    keyword: '',
    source: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState({
    resources: true,
    heatmap: false,
  });

  useEffect(() => {
    fetchResources();
    logViewMap();
  }, []);

  useEffect(() => {
    if (filters.zipCode || filters.categories.length > 0 || filters.keyword || filters.source) {
      logFilterMap(
        filters.zipCode,
        filters.categories.join(','),
        filters.keyword,
        filters.source
      );
    }
  }, [filters]);

  async function fetchResources() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('name');

      if (error) throw error;

      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (filters.zipCode && resource.zip_code !== filters.zipCode) {
        return false;
      }

      if (filters.categories.length > 0 && !filters.categories.includes(resource.category || '')) {
        return false;
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const matchesKeyword =
          resource.name.toLowerCase().includes(keyword) ||
          resource.services?.toLowerCase().includes(keyword) ||
          resource.category?.toLowerCase().includes(keyword);
        if (!matchesKeyword) return false;
      }

      if (filters.source && filters.source !== 'All' && resource.source !== filters.source) {
        return false;
      }

      if (resource.zip_code && !FULTON_ZIP_CODES.includes(resource.zip_code.trim())) {
        return false;
      }

      return true;
    });
  }, [resources, filters]);

  const handleMarkerClick = (resourceId: string) => {
    logClickMarker(resourceId);
  };

  const handleViewDetails = (resourceId: string) => {
    navigate(`/resource/${resourceId}`);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row relative">
      <div
        className={`${
          showFilters ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 fixed md:relative z-30 w-80 h-full bg-white md:border-r border-gray-200 overflow-hidden flex flex-col`}
      >
        <MapFilterSidebar
          onFilterChange={setFilters}
          resultCount={filteredResources.length}
          isMobile={true}
          onClose={() => setShowFilters(false)}
        />
        <div className="p-4 border-t border-gray-200">
          <MapLegend />
        </div>
      </div>

      {showFilters && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setShowFilters(false)}
        />
      )}

      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
            aria-label="Toggle filters"
          >
            {showFilters ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setShowLayers(!showLayers)}
            className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
            aria-label="Toggle layers"
          >
            <Layers className="w-6 h-6" />
          </button>
        </div>

        {showLayers && (
          <div className="absolute top-20 left-4 z-10 bg-white shadow-lg rounded-lg p-4 w-64">
            <h3 className="font-semibold text-gray-900 mb-3">Layers</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.resources}
                  onChange={(e) => setLayers({ ...layers, resources: e.target.checked })}
                  className="w-4 h-4 text-[#2563eb] border-gray-300 rounded focus:ring-[#2563eb]"
                />
                <span className="text-sm text-gray-700">Resources</span>
              </label>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
              <p className="mt-4 text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {layers.resources &&
              filteredResources.map((resource) => {
                if (!resource.lat || !resource.lng) return null;

                const icon = createCustomIcon(
                  CATEGORY_COLORS[resource.category || ''] || CATEGORY_COLORS.default
                );

                return (
                  <Marker
                    key={resource.id}
                    position={[resource.lat, resource.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => handleMarkerClick(resource.id),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[250px]">
                        <h3 className="font-bold text-gray-900 mb-2">{resource.name}</h3>
                        {resource.category && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Category:</strong> {resource.category}
                          </p>
                        )}
                        {resource.address && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Address:</strong> {resource.address}
                          </p>
                        )}
                        {resource.phone && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Phone:</strong>{' '}
                            <a
                              href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                              className="text-[#2563eb] hover:underline"
                            >
                              {resource.phone}
                            </a>
                          </p>
                        )}
                        {resource.hours && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Hours:</strong> {resource.hours}
                          </p>
                        )}
                        {resource.eligibility && (
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Eligibility:</strong> {resource.eligibility}
                          </p>
                        )}
                        <button
                          onClick={() => handleViewDetails(resource.id)}
                          className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            <MapBoundsHandler resources={filteredResources} />
          </MapContainer>
        )}
      </div>
    </div>
  );
}
