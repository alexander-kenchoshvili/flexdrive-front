import { defineEventHandler } from "h3";
import { proxySocialOAuthRequest } from "../../../utils/socialOAuthProxy";

const GOOGLE_CALLBACK_PATH = "accounts/google/callback/";

export default defineEventHandler((event) =>
  proxySocialOAuthRequest(event, GOOGLE_CALLBACK_PATH),
);
