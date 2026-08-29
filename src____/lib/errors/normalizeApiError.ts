export function extractErrorMessages(
  error: unknown,
  messages: string[] = []
): string[] {
  if (!error) return messages;

  if (typeof error === "string") {
    messages.push(error);
    return messages;
  }

  if (Array.isArray(error)) {
    error.forEach(e => extractErrorMessages(e, messages));
    return messages;
  }

  if (typeof error === "object") {
    Object.values(error).forEach(value =>
      extractErrorMessages(value, messages)
    );
  }

  return messages;
}

export function normalizeApiError(err: any): string[] {
  const data = err?.response?.data ?? err;

  if (typeof data?.message === "string") {
    return [data.message];
  }

  if (data?.details) {
    const extracted = extractErrorMessages(data.details);
    if (extracted.length > 0) return extracted;
  }

  return ["Something went wrong. Please try again."];
}
