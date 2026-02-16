import { supabase } from './supabase';
import type { AnalyticsEvent } from './types';

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('anon_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('anon_session_id', sessionId);
  }
  return sessionId;
}

export async function logEvent(
  eventType: AnalyticsEvent['event_type'],
  data?: Partial<Omit<AnalyticsEvent, 'event_type' | 'anon_session_id'>>
): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();

    const event: Omit<AnalyticsEvent, 'id' | 'created_at'> = {
      event_type: eventType,
      anon_session_id: sessionId,
      zip_code: data?.zip_code || null,
      category: data?.category || null,
      resource_id: data?.resource_id || null,
      metadata: data?.metadata || {},
    };

    await supabase.from('events').insert(event);
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

export function logSearch(zipCode?: string, category?: string, keyword?: string): Promise<void> {
  return logEvent('search', {
    zip_code: zipCode,
    category,
    metadata: { keyword },
  });
}

export function logViewResource(resourceId: string, zipCode?: string, category?: string): Promise<void> {
  return logEvent('view_resource', {
    resource_id: resourceId,
    zip_code: zipCode,
    category,
  });
}

export function logClickCall(resourceId: string): Promise<void> {
  return logEvent('click_call', {
    resource_id: resourceId,
  });
}

export function logClickWebsite(resourceId: string): Promise<void> {
  return logEvent('click_website', {
    resource_id: resourceId,
  });
}

export function logAIQuery(query: string, zipCode?: string, category?: string): Promise<void> {
  return logEvent('ai_query', {
    zip_code: zipCode,
    category,
    metadata: { query },
  });
}

export function logViewMap(zipCode?: string, category?: string): Promise<void> {
  return logEvent('view_map', {
    zip_code: zipCode,
    category,
  });
}

export function logClickMarker(resourceId: string): Promise<void> {
  return logEvent('click_marker', {
    resource_id: resourceId,
  });
}

export function logFilterMap(zipCode?: string, category?: string, keyword?: string, source?: string): Promise<void> {
  return logEvent('filter_map', {
    zip_code: zipCode,
    category,
    metadata: { keyword, source },
  });
}
