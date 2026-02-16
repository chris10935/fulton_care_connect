import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CSVRow {
  name: string;
  phone: string;
  address: string;
  services: string;
  hours: string;
  eligibility: string;
  website: string;
  lat: string;
  lng: string;
  source: string;
  category: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',');

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row as CSVRow);
    }
  }

  return rows;
}

function generateEmbeddingContent(row: CSVRow): string {
  const parts: string[] = [];

  if (row.name) parts.push(row.name);
  if (row.services) parts.push(`Services: ${row.services}`);
  if (row.eligibility) parts.push(`Eligibility: ${row.eligibility}`);
  if (row.hours) parts.push(`Hours: ${row.hours}`);
  if (row.address) parts.push(`Address: ${row.address}, ${row.zip_code || ''}`);
  if (row.phone) parts.push(`Phone: ${row.phone}`);
  if (row.website) parts.push(`Website: ${row.website}`);
  if (row.category) parts.push(`Category: ${row.category}`);

  return parts.join('. ');
}

function extractCity(address: string): string | null {
  if (!address) return null;
  const match = address.match(/,\s*([^,]+),\s*GA/);
  return match ? match[1].trim() : null;
}

function extractZipCode(address: string, zipField: string): string | null {
  if (zipField) return zipField;
  if (!address) return null;
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

async function importData() {
  console.log('Reading CSV file...');
  const csvPath = join(process.cwd(), 'data', 'fulton_phase1_data.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  console.log('Parsing CSV...');
  const rows = parseCSV(csvContent);
  console.log(`Found ${rows.length} rows`);

  console.log('Importing resources...');

  for (const row of rows) {
    const city = extractCity(row.address) || 'Atlanta';
    const zipCode = extractZipCode(row.address, row.lat);

    const resource = {
      name: row.name,
      phone: row.phone || null,
      address: row.address || null,
      city: city,
      county: 'Fulton',
      zip_code: zipCode,
      lat: row.lat ? parseFloat(row.lat) : null,
      lng: row.lng ? parseFloat(row.lng) : null,
      category: row.category || null,
      services: row.services || null,
      hours: row.hours || null,
      eligibility: row.eligibility || null,
      website: row.website || null,
      source: row.source || null,
      verified_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .single();

    if (error) {
      console.error(`Error inserting ${row.name}:`, error.message);
      continue;
    }

    const embeddingContent = generateEmbeddingContent(row);

    const { error: embError } = await supabase
      .from('resource_embeddings')
      .insert({
        resource_id: data.id,
        content: embeddingContent,
      });

    if (embError) {
      console.error(`Error inserting embedding for ${row.name}:`, embError.message);
    }

    console.log(`Imported: ${row.name}`);
  }

  console.log('Import complete!');
}

importData().catch(console.error);
