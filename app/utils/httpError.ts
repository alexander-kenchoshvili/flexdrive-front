type HttpErrorPayload =
  | string
  | {
      detail?: string;
      error?: string;
      message?: string;
      statusMessage?: string;
    }
  | null
  | undefined;

type HttpErrorLike = Error & {
  cause?: unknown;
  data?: HttpErrorPayload;
  response?: {
    _data?: HttpErrorPayload;
    status?: number;
    statusText?: string;
  };
  status?: number;
  statusCode?: number;
  statusMessage?: string;
};

type PageLoadErrorInput = {
  cause?: unknown;
  statusCode: number;
  statusMessage: string;
};

const readPayloadMessage = (payload: HttpErrorPayload) => {
  if (!payload) return null;

  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  return (
    payload.statusMessage?.trim() ||
    payload.message?.trim() ||
    payload.error?.trim() ||
    payload.detail?.trim() ||
    null
  );
};

export const resolveHttpStatusCode = (error: unknown): number | null => {
  const normalized = error as HttpErrorLike | null | undefined;

  return (
    normalized?.statusCode ??
    normalized?.status ??
    normalized?.response?.status ??
    null
  );
};

export const resolveHttpStatusMessage = (error: unknown): string | null => {
  const normalized = error as HttpErrorLike | null | undefined;

  return (
    normalized?.statusMessage?.trim() ||
    readPayloadMessage(normalized?.data) ||
    readPayloadMessage(normalized?.response?._data) ||
    normalized?.response?.statusText?.trim() ||
    normalized?.message?.trim() ||
    null
  );
};

export const createPageLoadError = ({
  cause,
  statusCode,
  statusMessage,
}: PageLoadErrorInput) => {
  const error = new Error(statusMessage) as HttpErrorLike;
  error.statusCode = statusCode;
  error.statusMessage = statusMessage;

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
};

export const normalizePageLoadError = (
  error: unknown,
  fallback: Omit<PageLoadErrorInput, "cause">,
) =>
  createPageLoadError({
    cause: error,
    statusCode: resolveHttpStatusCode(error) ?? fallback.statusCode,
    statusMessage:
      resolveHttpStatusMessage(error) || fallback.statusMessage,
  });
