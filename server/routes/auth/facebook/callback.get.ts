import { defineEventHandler } from "h3";
import { proxySocialOAuthRequest } from "../../../utils/socialOAuthProxy";

const FACEBOOK_CALLBACK_PATH = "accounts/facebook/callback/";

export default defineEventHandler((event) =>
  proxySocialOAuthRequest(event, FACEBOOK_CALLBACK_PATH),
);
