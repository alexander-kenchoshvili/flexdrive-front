export interface AccountProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  address_line: string;
  pending_email: string;
}

export type AccountProfileUpdatePayload = Omit<AccountProfile, "id" | "pending_email"> & {
  current_password?: string;
};
