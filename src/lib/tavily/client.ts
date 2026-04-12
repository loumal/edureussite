// Tavily client — utilise fetch natif plutôt que le SDK axios (@tavily/core)
// pour une meilleure compatibilité avec les environnements serverless Vercel.

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchOptions {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
  excludeDomains?: string[];
}

/**
 * Recherche web via Tavily REST API. Retourne les résultats ou un tableau vide si non configuré.
 */
export async function rechercherWeb(
  query: string,
  options?: TavilySearchOptions
): Promise<{ results: TavilyResult[]; disponible: boolean }> {
  const key = process.env.TAVILY_API_KEY;

  if (!key || key.trim() === "" || key.startsWith("tvly-...")) {
    return { results: [], disponible: false };
  }

  try {
    const body: Record<string, unknown> = {
      query,
      max_results: options?.maxResults ?? 8,
      search_depth: options?.searchDepth ?? "basic",
    };
    if (options?.includeDomains?.length) body.include_domains = options.includeDomains;
    if (options?.excludeDomains?.length) body.exclude_domains = options.excludeDomains;

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000), // timeout 30s
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error(`[Tavily] HTTP ${response.status}: ${errText}`);
      return { results: [], disponible: false };
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
        score?: number;
      }>;
    };

    const results: TavilyResult[] = (data.results ?? []).map((r) => ({
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

// Stub pour compatibilité avec les imports existants (agents.ts utilise getTavilyClient)
export function getTavilyClient() {
  const key = process.env.TAVILY_API_KEY;
  if (!key || key.trim() === "" || key.startsWith("tvly-...")) return null;
  return { configured: true };
}
