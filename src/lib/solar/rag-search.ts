import { SolarKnowledgeChunk } from '@/types/solar-ai';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const SEED_KNOWLEDGE_CHUNKS: SolarKnowledgeChunk[] = [
  {
    id: 'kb-string-sizing-rules',
    document_title: 'Philippine Electrical Code (PEC) Article 6.90 - PV String Voltage Calculations',
    category: 'electrical_code',
    content:
      'Under PEC Article 6.90 and NEC 690.7, maximum PV system DC voltage must be calculated at the lowest expected ambient temperature. For Luzon and Visayas, record low temperatures reach 18°C. Open-circuit voltage (Voc) rises as temperature drops, following the temperature coefficient gamma_Voc (typically -0.25%/°C to -0.28%/°C). The total series string Voc must never exceed the inverter absolute maximum DC input voltage (500V or 600V for residential, 800V-1000V for commercial). Exceeding this rating causes instantaneous component puncture and voids inverter warranty.',
  },
  {
    id: 'kb-deye-mppt-operating-range',
    document_title: 'Deye SUN-8K-SG01LP1-EU Hybrid Inverter Engineering Manual',
    category: 'datasheet',
    related_hardware_model: 'SUN-8K-SG01LP1-EU',
    content:
      'The Deye 8kW hybrid inverter features 2 MPPT trackers with an operating MPPT range of 150V to 425V and an absolute maximum DC input voltage of 500V. For 550W-600W Tier-1 panels (nominal Vmp ~42V-44V), minimum panels in series per MPPT to ensure early morning startup is 4 panels (170V), while optimal nominal string length is 6 to 9 panels per string (260V-380V). Connecting 14 or more modern panels in a single string violates the 500V maximum DC limit and must instead be split into 2 parallel strings (e.g., 7S2P or 8S2P across the 2 MPPTs).',
  },
  {
    id: 'kb-net-metering-philippines',
    document_title: 'ERC Net Metering Rules for End-Users in the Philippines',
    category: 'net_metering',
    content:
      'The Energy Regulatory Commission (ERC) Net-Metering Rules allow qualified end-users up to 100kW peak to export surplus daytime solar generation into distribution utility grids (Meralco, VECO, Davao Light). Export credits are valued at the utility blended generation cost (currently approximately ₱5.00 - ₱5.65/kWh), rather than retail retail rates (₱11.00 - ₱12.50/kWh). Because retail rates exceed export credits by over 50%, maximizing daytime self-consumption or storing surplus solar in LiFePO4 batteries yields significantly higher financial ROI than relying solely on net metering export.',
  },
  {
    id: 'kb-hybrid-vs-gridtie',
    document_title: 'Grid-Tie vs. Hybrid Solar Systems in the Philippines',
    category: 'sizing_guide',
    content:
      'Grid-Tie systems shut down instantly during utility blackouts (anti-islanding safety) and provide no brownout protection. They offer the lowest initial equipment investment and fastest payback (typically 3 to 4.5 years). Hybrid systems include an automatic transfer switch (ATS) and LiFePO4 battery storage, maintaining continuous electricity to critical lighting, refrigeration, and aircon loads within 10 milliseconds of a utility blackout. Payback for hybrid systems ranges from 4.5 to 6.5 years depending on battery capacity.',
  },
];

export async function searchSolarKnowledge(
  query: string,
  category?: 'datasheet' | 'electrical_code' | 'net_metering' | 'sizing_guide' | 'faq',
  limit = 3
): Promise<SolarKnowledgeChunk[]> {
  const queryClean = (query || '').toLowerCase().trim();

  // Try Supabase vector search if configured
  if (isSupabaseConfigured && supabase) {
    try {
      // If category is provided, use filter
      let queryBuilder = supabase
        .from('solar_knowledge_chunks')
        .select('id, document_title, category, related_hardware_model, content, metadata')
        .limit(limit);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      // Try text match if vector embedding is not set up on query
      const { data, error } = await queryBuilder;
      if (!error && data && data.length > 0) {
        // Simple client-side score for retrieved Supabase rows
        const scored = (data as SolarKnowledgeChunk[]).map((chunk) => {
          const titleScore = chunk.document_title.toLowerCase().includes(queryClean) ? 2 : 0;
          const contentScore = chunk.content.toLowerCase().includes(queryClean) ? 1 : 0;
          return {
            ...chunk,
            similarity: titleScore + contentScore > 0 ? 0.85 : 0.6,
          };
        });
        return scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0)).slice(0, limit);
      }
    } catch (err) {
      console.warn('Supabase RAG query error, falling back to local seed:', err);
    }
  }

  // Local Seed Fallback
  const terms = queryClean.split(/\s+/).filter((t) => t.length > 2);

  const matched = SEED_KNOWLEDGE_CHUNKS.filter((chunk) => {
    if (category && chunk.category !== category) return false;
    return true;
  }).map((chunk) => {
    let score = 0;
    const titleLower = chunk.document_title.toLowerCase();
    const contentLower = chunk.content.toLowerCase();
    const modelLower = (chunk.related_hardware_model || '').toLowerCase();

    if (queryClean.length > 0) {
      if (titleLower.includes(queryClean)) score += 5;
      if (contentLower.includes(queryClean)) score += 3;
      if (modelLower && queryClean.includes(modelLower)) score += 6;

      for (const term of terms) {
        if (titleLower.includes(term)) score += 2;
        if (contentLower.includes(term)) score += 1;
        if (modelLower && modelLower.includes(term)) score += 3;
      }
    }

    return {
      ...chunk,
      similarity: Number((score > 0 ? Math.min(0.99, 0.5 + score * 0.08) : 0.5).toFixed(2)),
    };
  });

  return matched
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, limit);
}
