export interface AccountProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  address_line: string;
}

export type AccountProfileUpdatePayload = Omit<AccountProfile, "id">;
