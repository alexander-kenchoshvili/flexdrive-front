import { defineEventHandler } from "h3";
import { proxySocialOAuthRequest } from "../../../utils/socialOAuthProxy";

const GOOGLE_START_PATH = "accounts/google/start/";

export default defineEventHandler((event) =>
  proxySocialOAuthRequest(event, GOOGLE_START_PATH),
);
