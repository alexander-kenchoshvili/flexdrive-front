import { resolveHttpStatusCode } from "~/utils/httpError";

export const publicPageError = (error: unknown, temporaryMessage: string) => {
  const status = resolveHttpStatusCode(error);
  const statusCode = status === 404 || status === 429 ||
    (typeof status === "number" && Number.isInteger(status) && status >= 500 && status <= 599)
    ? status : 503;
  return {
    statusCode,
    statusMessage: ({
      404: "Not Found", 429: "Too Many Requests", 500: "Internal Server Error",
      502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout",
    } as Record<number, string>)[statusCode] || "Server Error",
    message: statusCode === 404 ? "გვერდი ვერ მოიძებნა" : temporaryMessage,
  };
};
