import { defineEventHandler } from "h3";
import { proxySocialOAuthRequest } from "../../../utils/socialOAuthProxy";

const FACEBOOK_START_PATH = "accounts/facebook/start/";

export default defineEventHandler((event) =>
  proxySocialOAuthRequest(event, FACEBOOK_START_PATH),
);
