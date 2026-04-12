import { tavily } from "@tavily/core";

// Retourne null si la clé n'est pas configurée (mode dégradé gracieux)
export function getTavilyClient() {
  const key = process.env.TAVILY_API_KEY;
  if (!key || key.startsWith("tvly-...")) return null;
  return tavily({ apiKey: key });
}

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

/**
 * Recherche web via Tavily. Retourne les résultats ou null si non configuré.
 */
export async function rechercherWeb(
  query: string,
  options?: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeDomains?: string[];
    excludeDomains?: string[];
  }
): Promise<{ results: TavilyResult[]; disponible: boolean }> {
  const client = getTavilyClient();

  if (!client) {
    return { results: [], disponible: false };
  }

  try {
    const response = await client.search(query, {
      maxResults: options?.maxResults ?? 8,
      searchDepth: options?.searchDepth ?? "advanced",
      includeDomains: options?.includeDomains,
      excludeDomains: options?.excludeDomains,
    });

    const results: TavilyResult[] = (response.results ?? []).map((r: {
      title?: string;
      url?: string;
      content?: string;
      score?: number;
    }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
      score: r.score ?? 0,
    }));

    return { results, disponible: true };
  } catch (e) {
    console.error("[Tavily] Erreur de recherche:", e);
    return { results: [], disponible: false };
  }
}

/**
 * Formate les résultats Tavily en contexte lisible pour Claude.
 */
export function formaterContexteWeb(results: TavilyResult[]): string {
  if (results.length === 0) return "";

  return results
    .map((r, i) =>
      `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 600)}`
    )
    .join("\n\n---\n\n");
}
