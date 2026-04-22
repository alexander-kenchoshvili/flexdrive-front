export interface FooterBrandData {
  name: string;
  description: string;
}

export interface FooterLinkItem {
  id: number;
  label: string;
  slug: string;
  url: string;
  footer_order: number;
}

export interface FooterLinkGroups {
  navigation: FooterLinkItem[];
  help: FooterLinkItem[];
  legal: FooterLinkItem[];
}

export interface FooterContactData {
  phone: string | null;
  email: string | null;
  working_hours: string | null;
  city: string | null;
}

export interface FooterSocialItem {
  type: string;
  label: string;
  url: string;
}

export interface FooterPayload {
  brand: FooterBrandData;
  trust_items: string[];
  groups: FooterLinkGroups;
  contact: FooterContactData;
  socials: FooterSocialItem[];
  copyright_text: string | null;
}
