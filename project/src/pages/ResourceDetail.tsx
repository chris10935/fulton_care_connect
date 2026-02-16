import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Globe, Clock, Users, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logViewResource, logClickCall, logClickWebsite } from '../lib/analytics';
import { CATEGORIES } from '../lib/constants';
import type { Resource } from '../lib/types';

export function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchResource(id);
      logViewResource(id);
    }
  }, [id]);

  async function fetchResource(resourceId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .maybeSingle();

      if (error) throw error;

      setResource(data);
    } catch (error) {
      console.error('Error fetching resource:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCallClick = () => {
    if (resource) {
      logClickCall(resource.id);
    }
  };

  const handleWebsiteClick = () => {
    if (resource) {
      logClickWebsite(resource.id);
    }
  };

  const normalizeWebsiteUrl = (url: string): string => {
    if (!url) return '';
    let normalized = url.trim();
    if (normalized.startsWith('https//')) {
      normalized = normalized.replace('https//', 'https://');
    } else if (normalized.startsWith('http//')) {
      normalized = normalized.replace('http//', 'http://');
    } else if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
        <p className="mt-4 text-gray-600">Loading resource details...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-600">Resource not found.</p>
        <Link to="/directory" className="text-[#2563eb] hover:underline mt-4 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/directory"
        className="inline-flex items-center gap-2 text-[#2563eb] hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.name}</h1>
            {resource.category && (
              <span className="px-3 py-1 bg-[#2563eb]/10 text-[#2563eb] rounded-full text-sm font-medium">
                {CATEGORIES.find((c) => c.id === resource.category)?.label || resource.category}
              </span>
            )}
          </div>
        </div>

        {resource.services && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Services</h2>
            <p className="text-gray-700 leading-relaxed">{resource.services}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {resource.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#2563eb] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-700">{resource.address}</p>
                {resource.city && (
                  <p className="text-gray-700">
                    {resource.city}, {resource.county} County {resource.zip_code}
                  </p>
                )}
              </div>
            </div>
          )}

          {resource.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#2563eb] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <a
                  href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                  onClick={handleCallClick}
                  className="text-[#2563eb] hover:underline font-medium"
                >
                  {resource.phone}
                </a>
              </div>
            </div>
          )}

          {resource.website && (
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-[#2563eb] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
                <a
                  href={normalizeWebsiteUrl(resource.website)}
                  onClick={handleWebsiteClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563eb] hover:underline break-all"
                >
                  {resource.website.replace(/^https?:?\/\//, '')}
                </a>
              </div>
            </div>
          )}

          {resource.hours && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#2563eb] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Hours</h3>
                <p className="text-gray-700">{resource.hours}</p>
              </div>
            </div>
          )}
        </div>

        {resource.eligibility && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#2563eb] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Eligibility</h3>
                <p className="text-gray-700">{resource.eligibility}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          {resource.phone && (
            <a
              href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
              onClick={handleCallClick}
              className="bg-[#fb923c] hover:bg-[#ea580c] text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
          )}

          {resource.website && (
            <a
              href={normalizeWebsiteUrl(resource.website)}
              onClick={handleWebsiteClick}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Globe className="w-5 h-5" />
              Visit Website
            </a>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            {resource.source && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Source: {resource.source}</span>
              </div>
            )}

            {resource.verified_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Verified: {new Date(resource.verified_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> Please call ahead to confirm hours, eligibility, and
              services before visiting. Resource information may have changed since last verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
