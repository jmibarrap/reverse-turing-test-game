export function extractJSON(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();

  // 1. Direct parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    // continue
  }

  // 2. Extract from markdown code block
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      // continue
    }
  }

  // 3. Extract first {...} block
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      // continue
    }
  }

  // 4. Try to repair common issues: single quotes, trailing commas
  try {
    const repaired = trimmed
      .replace(/'/g, '"')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    // continue
  }

  return null;
}

export function isValidConversationResponse(
  obj: unknown
): obj is { message: string; asksNext: boolean; questionToNext: string } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return typeof o.message === 'string' && o.message.trim().length > 0;
}

export function isValidVoteResponse(
  obj: unknown,
  eligibleIds: string[]
): obj is { targetId: string; confidence: number; privateReason: string } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return typeof o.targetId === 'string' && eligibleIds.includes(o.targetId);
}
