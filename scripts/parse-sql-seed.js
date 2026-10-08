// scripts/parse-sql-seed.js
import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve('supabase_hybrid_ongrid_seed.sql');
const content = fs.readFileSync(sqlPath, 'utf-8');

function extractInserts(tableName) {
  const regex = new RegExp(`insert into ${tableName}\\s*\\(([^)]+)\\)\\s*values\\s*\\((.+?)\\)\\s*on conflict`, 'gi');
  const items = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const cols = match[1].split(',').map(s => s.trim());
    const rawVals = match[2];
    
    // Parse values taking quotes into account
    const vals = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < rawVals.length; i++) {
      const c = rawVals[i];
      if (c === "'" && (i === 0 || rawVals[i - 1] !== '\\')) {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        vals.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    vals.push(cur.trim());

    const obj = {};
    cols.forEach((col, idx) => {
      let val = vals[idx];
      if (val === undefined) return;
      if (val === 'NULL') {
        obj[col] = null;
      } else if (val.startsWith("'") && val.endsWith("'")) {
        obj[col] = val.slice(1, -1).replace(/''/g, "'");
      } else if (!isNaN(Number(val))) {
        obj[col] = Number(val);
      } else if (val === 'true' || val === 'false') {
        obj[col] = val === 'true';
      } else {
        obj[col] = val;
      }
    });
    items.push(obj);
  }
  return items;
}

const outDir = path.resolve('src/data/seed');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tables = [
  'solar_inverters',
  'solar_modules',
  'batteries',
  'calculator_rule_breakers',
  'calculator_rule_wires',
  'calculator_rule_conduit',
  'calculator_rule_isolators',
  'calculator_rule_grounding',
  'calculator_accessories',
];

for (const t of tables) {
  const data = extractInserts(t);
  console.log(`Extracted ${data.length} records for ${t}`);
  fs.writeFileSync(path.join(outDir, `${t}.json`), JSON.stringify(data, null, 2));
}

console.log('Seed extraction complete!');
