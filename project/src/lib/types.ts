export interface Resource {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  county: string;
  zip_code: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
  services: string | null;
  hours: string | null;
  eligibility: string | null;
  website: string | null;
  verified_date: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id?: string;
  event_type: 'search' | 'view_resource' | 'click_call' | 'click_website' | 'ai_query';
  anon_session_id: string;
  zip_code?: string | null;
  category?: string | null;
  resource_id?: string | null;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  zipCode?: string;
  category?: string;
  keyword?: string;
}

export interface DashboardStats {
  resourcesByCategory: { category: string; count: number }[];
  resourcesByZip: { zip_code: string; count: number }[];
  dataQuality: {
    missingPhone: number;
    missingHours: number;
    missingEligibility: number;
    missingWebsite: number;
    staleVerifiedDate: number;
  };
  searchesByZip: { zip_code: string; count: number }[];
  clicksByCategory: { category: string; count: number }[];
  topViewedResources: { resource_id: string; resource_name: string; count: number }[];
  topCallClicks: { resource_id: string; resource_name: string; count: number }[];
  topWebsiteClicks: { resource_id: string; resource_name: string; count: number }[];
}
