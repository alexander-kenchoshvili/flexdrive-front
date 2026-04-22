export type ContactTopic = {
  id: number;
  slug: string;
  label: string;
  position: number;
};

export type ContactShortcut = {
  id: number;
  slug: string;
  title: string;
  description: string;
  iconSvg: string;
  position: number;
  routePath: string;
};

export type ContactNotice = {
  id: number;
  slug: string;
  title: string;
  description: string;
  html: string;
  position: number;
};

export type ContactExpectation = {
  id: number;
  title: string;
  description: string;
  position: number;
};

export type ContactReason = {
  id: number;
  title: string;
  description: string;
  position: number;
};

export type ContactInquiryPayload = {
  full_name: string;
  phone: string;
  email: string;
  topic_slug: string;
  order_number?: string;
  message: string;
  recaptcha_token: string;
};

export type ContactInquiryResponse = {
  message: string;
};
