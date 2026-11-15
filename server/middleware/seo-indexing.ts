import { defineEventHandler, setHeader } from "h3";
import { mustExcludeRequest } from "../utils/seoPolicy";

export default defineEventHandler((event) => {
  // Apply before redirect/stream handlers as well as at beforeResponse.
  if (mustExcludeRequest(event, useRuntimeConfig(event))) {
    setHeader(event, "x-robots-tag", "noindex, nofollow");
  }
});
