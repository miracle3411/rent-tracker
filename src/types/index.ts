export interface Entry {
  id: number;
  created_at: string;
  property_name: string | null;
  property_address: string | null;
  unit_number: string | null;
  guest_name: string | null;
  phone_number: string | null;
  email: string | null;
  guest_address: string | null;
  monthly_rent: number | null;
  advanced_payment: number | null;
  deposit: number | null;
  remaining_payment: number | null;
  booking_date: string | null;
  meter_reading: number | null;
  meter_reading_date: string | null;
  notes: string | null;
  notification_id: string | null;
}

export type EntryInput = Omit<Entry, 'id' | 'created_at' | 'notification_id'>;

export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
  Detail: { id: number };
  EditEntry: { id: number };
};
