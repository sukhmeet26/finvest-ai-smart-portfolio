import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const CHAT_MODEL = "google/gemini-2.5-flash";

export function gatewayErrorMessage(error: unknown): string {
  const status = (error as { statusCode?: number })?.statusCode;
  if (status === 402) return "AI credits are exhausted for this workspace. Add credits in Lovable to re-enable AI narration.";
  if (status === 403) return "AI access is blocked by workspace policy.";
  if (status === 429) return "AI gateway is rate limited right now. Please retry in a moment.";
  return "The AI narration service is unavailable; deterministic risk output below is unaffected.";
}