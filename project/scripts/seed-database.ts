import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Prefer the service role key when available (bypasses row-level security for seeding).
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials (VITE_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Maps every raw category variant in the CSV to a single normalized label.
const CATEGORY_MAP: Record<string, string> = {
  'mental health': 'Mental Health',
  'healthcare': 'Healthcare',
  'financial help': 'Financial',
  'financial_help': 'Financial',
  'financial coaching': 'Financial',
  'homeless shelter': 'Shelter',
  'homeless_shelter': 'Shelter',
  'shelter': 'Housing',
  'housing': 'Housing',
  'housing_resources': 'Housing',
  'food': 'Food',
  'food_pantry': 'Food',
  'food assiatance': 'Food',
  'legal': 'Legal',
  'legal aid': 'Legal',
  'legal assistance': 'Legal',
  'employment': 'Employment',
  'job training': 'Employment',
  'employment_training': 'Employment',
  'transportation': 'Transportation',
  'utilities': 'Utilities',
  'career': 'Employment',
  'youth services': 'Youth Services',
  'family services': 'Family Services',
};

// Maps raw source variants to a normalised label.
const SOURCE_MAP: Record<string, string> = {
  'facaa (linked)': 'FACAA',
  'facaa': 'FACAA',
  'dfcs': 'DFCS',
  'skye': 'SKYE',
  'fulton_services_dataset': 'Fulton Services',
};

function normalizeCategory(raw: string | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return CATEGORY_MAP[key] || raw.trim(); // fall back to trimmed original
}

function normalizeSource(raw: string | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return SOURCE_MAP[key] || raw.trim();
}

interface CSVRecord {
  [key: string]: string;
}

/**
 * Header-aware CSV parser that handles quoted fields with embedded
 * commas, newlines and escaped double-quotes.
 */
function parseCSV(content: string): CSVRecord[] {
  const records: CSVRecord[] = [];
  let pos = 0;

  // ---- helpers ----
  function parseField(): string {
    if (pos >= content.length) return '';

    if (content[pos] === '"') {
      // quoted field – may span multiple lines
      pos++; // skip opening quote
      let value = '';
      while (pos < content.length) {
        if (content[pos] === '"') {
          if (pos + 1 < content.length && content[pos + 1] === '"') {
            value += '"';
            pos += 2;
          } else {
            pos++; // skip closing quote
            break;
          }
        } else {
          value += content[pos];
          pos++;
        }
      }
      return value;
    }

    // unquoted field – ends at comma or line break
    let value = '';
    while (pos < content.length && content[pos] !== ',' && content[pos] !== '\n' && content[pos] !== '\r') {
      value += content[pos];
      pos++;
    }
    return value;
  }

  function parseLine(): string[] {
    const fields: string[] = [];
    while (pos < content.length) {
      fields.push(parseField());
      if (pos < content.length && content[pos] === ',') {
        pos++; // skip comma
        continue;
      }
      // end of line
      if (pos < content.length && content[pos] === '\r') pos++;
      if (pos < content.length && content[pos] === '\n') pos++;
      break;
    }
    return fields;
  }

  // ---- parse header ----
  const headers = parseLine().map((h) => h.trim());

  // ---- parse data rows ----
  while (pos < content.length) {
    if (content[pos] === '\r' || content[pos] === '\n') {
      pos++;
      continue;
    }
    const values = parseLine();
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const record: CSVRecord = {};
    headers.forEach((header, i) => {
      record[header] = (values[i] ?? '').trim();
    });
    records.push(record);
  }

  return records;
}

function generateEmbeddingContent(row: CSVRecord, category: string | null): string {
  const parts: string[] = [];

  if (row.name) parts.push(row.name);
  if (row.services) parts.push(`Services: ${row.services}`);
  if (row.eligibility) parts.push(`Eligibility: ${row.eligibility}`);
  if (row.hours) parts.push(`Hours: ${row.hours}`);
  if (row.address) parts.push(`Address: ${row.address}${row.zip_code ? ', ' + row.zip_code : ''}`);
  if (row.phone) parts.push(`Phone: ${row.phone}`);
  if (row.website) parts.push(`Website: ${row.website}`);
  if (category) parts.push(`Category: ${category}`);

  return parts.join('. ');
}

async function clearExistingData() {
  console.log('Clearing existing data...');
  await supabase.from('resource_embeddings').delete().neq('resource_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('resources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Existing data cleared');
}

async function importData() {
  console.log('Reading CSV file...');
  const csvPath = join(process.cwd(), 'data', 'resources_rows.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  console.log('Parsing CSV...');
  const rows = parseCSV(csvContent);
  console.log(`Found ${rows.length} rows to import`);

  await clearExistingData();

  console.log('Importing resources...');
  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
      const category = normalizeCategory(row.category);
      const source = normalizeSource(row.source);

      const resource: Record<string, unknown> = {
        name: row.name || 'Unknown',
        phone: row.phone || null,
        address: row.address || null,
        city: row.city || 'Atlanta',
        county: row.county || 'Fulton',
        zip_code: row.zip_code?.replace(/\s/g, '') || null,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        category,
        services: row.services || null,
        hours: row.hours || null,
        eligibility: row.eligibility || null,
        website: row.website || null,
        source,
        verified_date: row.verified_date || new Date().toISOString().split('T')[0],
      };

      // Preserve the original UUID if present
      if (row.id && row.id.match(/^[0-9a-f-]{36}$/i)) {
        resource.id = row.id;
      }

      const { data, error } = await supabase
        .from('resources')
        .upsert(resource, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting ${row.name}:`, error.message);
        errorCount++;
        continue;
      }

      const embeddingContent = generateEmbeddingContent(row, category);

      const { error: embError } = await supabase
        .from('resource_embeddings')
        .upsert(
          { resource_id: data.id, content: embeddingContent },
          { onConflict: 'resource_id' }
        );

      if (embError) {
        console.error(`Error inserting embedding for ${row.name}:`, embError.message);
      }

      successCount++;
      console.log(`✓ Imported: ${row.name}`);
    } catch (err) {
      console.error(`Exception importing ${row.name}:`, err);
      errorCount++;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Successfully imported: ${successCount} resources`);
  console.log(`Errors: ${errorCount}`);
  console.log('Import complete!');
}

importData().catch(console.error);
