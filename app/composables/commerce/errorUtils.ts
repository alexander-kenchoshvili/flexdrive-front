export const extractFirstErrorMessage = (payload: unknown): string | null => {
  if (!payload) return null;

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedMessage = extractFirstErrorMessage(item);
      if (nestedMessage) return nestedMessage;
    }
    return null;
  }

  if (typeof payload === "object") {
    const normalizedPayload = payload as Record<string, unknown>;
    const priorityKeys = [
      "detail",
      "quantity",
      "product_id",
      "payment_method",
      "non_field_errors",
      "message",
    ];
    const keys = [...priorityKeys, ...Object.keys(normalizedPayload)];
    const seen = new Set<string>();

    for (const key of keys) {
      if (seen.has(key) || !(key in normalizedPayload)) continue;
      seen.add(key);

      const nestedMessage = extractFirstErrorMessage(normalizedPayload[key]);
      if (nestedMessage) return nestedMessage;
    }
  }

  return null;
};

export const normalizeApiErrorMessage = (error: unknown, fallback: string) => {
  const normalizedError = error as
    | {
        data?: unknown;
        response?: {
          _data?: unknown;
          data?: unknown;
        };
        message?: string;
      }
    | undefined;

  return (
    extractFirstErrorMessage(normalizedError?.data) ||
    extractFirstErrorMessage(normalizedError?.response?._data) ||
    extractFirstErrorMessage(normalizedError?.response?.data) ||
    normalizedError?.message ||
    fallback
  );
};

export const extractApiErrorPayload = (error: unknown) => {
  const normalizedError = error as
    | {
        data?: unknown;
        response?: {
          _data?: unknown;
          data?: unknown;
        };
      }
    | undefined;

  return (
    normalizedError?.data ||
    normalizedError?.response?._data ||
    normalizedError?.response?.data ||
    null
  );
};
