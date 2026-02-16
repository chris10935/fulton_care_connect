import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { TrendingUp, Database, Activity } from 'lucide-react';

interface CategoryCount {
  category: string;
  count: number;
}

interface ZipCount {
  zip_code: string;
  count: number;
}

interface EventCount {
  event_type: string;
  count: number;
}

export function Insights() {
  const [loading, setLoading] = useState(true);
  const [resourcesByCategory, setResourcesByCategory] = useState<CategoryCount[]>([]);
  const [resourcesByZip, setResourcesByZip] = useState<ZipCount[]>([]);
  const [dataQuality, setDataQuality] = useState({
    total: 0,
    missingPhone: 0,
    missingHours: 0,
    missingEligibility: 0,
    missingWebsite: 0,
    staleVerifiedDate: 0,
  });
  const [eventsByType, setEventsByType] = useState<EventCount[]>([]);
  const [searchesByZip, setSearchesByZip] = useState<ZipCount[]>([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    try {
      setLoading(true);

      const { data: resources } = await supabase.from('resources').select('*');

      if (resources) {
        const categoryMap = new Map<string, number>();
        const zipMap = new Map<string, number>();
        let missingPhone = 0;
        let missingHours = 0;
        let missingEligibility = 0;
        let missingWebsite = 0;
        let staleVerifiedDate = 0;

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        resources.forEach((resource) => {
          if (resource.category) {
            categoryMap.set(resource.category, (categoryMap.get(resource.category) || 0) + 1);
          }

          if (resource.zip_code) {
            zipMap.set(resource.zip_code, (zipMap.get(resource.zip_code) || 0) + 1);
          }

          if (!resource.phone) missingPhone++;
          if (!resource.hours) missingHours++;
          if (!resource.eligibility) missingEligibility++;
          if (!resource.website) missingWebsite++;

          if (!resource.verified_date || new Date(resource.verified_date) < sixMonthsAgo) {
            staleVerifiedDate++;
          }
        });

        setResourcesByCategory(
          Array.from(categoryMap.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        );

        setResourcesByZip(
          Array.from(zipMap.entries())
            .map(([zip_code, count]) => ({ zip_code, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15)
        );

        setDataQuality({
          total: resources.length,
          missingPhone,
          missingHours,
          missingEligibility,
          missingWebsite,
          staleVerifiedDate,
        });
      }

      const { data: events } = await supabase.from('events').select('*');

      if (events) {
        const eventTypeMap = new Map<string, number>();
        const searchZipMap = new Map<string, number>();

        events.forEach((event) => {
          eventTypeMap.set(event.event_type, (eventTypeMap.get(event.event_type) || 0) + 1);

          if (event.event_type === 'search' && event.zip_code) {
            searchZipMap.set(event.zip_code, (searchZipMap.get(event.zip_code) || 0) + 1);
          }
        });

        setEventsByType(
          Array.from(eventTypeMap.entries())
            .map(([event_type, count]) => ({ event_type, count }))
            .sort((a, b) => b.count - a.count)
        );

        setSearchesByZip(
          Array.from(searchZipMap.entries())
            .map(([zip_code, count]) => ({ zip_code, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        );
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
        <p className="mt-4 text-gray-600">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Insights & Dashboards</h1>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-[#2563eb]" />
          <h2 className="text-2xl font-bold text-gray-900">Resource Coverage</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources by Category</h3>
            {resourcesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourcesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600">No data available</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 15 ZIPs by Resource Count</h3>
            {resourcesByZip.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourcesByZip}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zip_code" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{dataQuality.total}</div>
              <div className="text-sm text-gray-600">Total Resources</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {dataQuality.total > 0 ? Math.round((dataQuality.missingPhone / dataQuality.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Missing Phone</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {dataQuality.total > 0 ? Math.round((dataQuality.missingHours / dataQuality.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Missing Hours</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {dataQuality.total > 0 ? Math.round((dataQuality.missingEligibility / dataQuality.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Missing Eligibility</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {dataQuality.total > 0 ? Math.round((dataQuality.staleVerifiedDate / dataQuality.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Stale Data (&gt;6mo)</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-[#2563eb]" />
          <h2 className="text-2xl font-bold text-gray-900">Directory Usage</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Activity</h3>
            {eventsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event_type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p>No usage data available yet.</p>
                <p className="text-sm mt-2">Start using the directory to see analytics here.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Search ZIPs</h3>
            {searchesByZip.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={searchesByZip}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zip_code" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#fb923c" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p>No search data available yet.</p>
                <p className="text-sm mt-2">Searches will appear here as users interact with the directory.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-[#2563eb]" />
          <h2 className="text-2xl font-bold text-gray-900">Community Needs</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Coverage Gaps</h3>
          {resourcesByZip.length > 0 ? (
            <div>
              <p className="text-gray-700 mb-4">
                ZIPs with lowest resource counts may indicate coverage gaps:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {resourcesByZip
                  .slice(-10)
                  .reverse()
                  .map((item) => (
                    <div key={item.zip_code} className="p-3 bg-yellow-50 rounded text-center">
                      <div className="font-bold text-gray-900">{item.zip_code}</div>
                      <div className="text-sm text-gray-600">{item.count} resources</div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No coverage data available</p>
          )}
        </div>
      </section>
    </div>
  );
}
