// src/lib/solar/rag-search.ts
import { SolarKnowledgeChunk } from '@/types/solar-ai';
import { SEED_KNOWLEDGE_CHUNKS } from './seed-catalog';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
