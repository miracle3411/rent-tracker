import { getDatabase } from './db';
import { Entry, EntryInput } from '../types';

export async function initDB(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      property_name TEXT,
      property_address TEXT,
      unit_number TEXT,
      guest_name TEXT,
      phone_number TEXT,
      email TEXT,
      guest_address TEXT,
      monthly_rent REAL,
      advanced_payment REAL,
      deposit REAL,
      remaining_payment REAL,
      booking_date TEXT,
      meter_reading REAL,
      meter_reading_date TEXT,
      notes TEXT,
      notification_id TEXT
    );
  `);
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN deposit REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN meter_reading REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN meter_reading_date TEXT'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN notification_id TEXT'); } catch {}
}

export async function getAllEntries(): Promise<Entry[]> {
  const db = await getDatabase();
  return db.getAllAsync<Entry>('SELECT * FROM entries ORDER BY created_at DESC');
}

export async function getEntryById(id: number): Promise<Entry | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Entry>('SELECT * FROM entries WHERE id = ?', id);
}

export async function createEntry(data: EntryInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO entries (
      created_at, property_name, property_address, unit_number,
      guest_name, phone_number, email, guest_address,
      monthly_rent, advanced_payment, deposit, remaining_payment,
      booking_date, meter_reading, meter_reading_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    new Date().toISOString(),
    data.property_name,
    data.property_address,
    data.unit_number,
    data.guest_name,
    data.phone_number,
    data.email,
    data.guest_address,
    data.monthly_rent,
    data.advanced_payment,
    data.deposit,
    data.remaining_payment,
    data.booking_date,
    data.meter_reading,
    data.meter_reading_date,
    data.notes
  );
  return result.lastInsertRowId;
}

export async function updateEntry(id: number, data: EntryInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE entries SET
      property_name = ?, property_address = ?, unit_number = ?,
      guest_name = ?, phone_number = ?, email = ?, guest_address = ?,
      monthly_rent = ?, advanced_payment = ?, deposit = ?, remaining_payment = ?,
      booking_date = ?, meter_reading = ?, meter_reading_date = ?, notes = ?
    WHERE id = ?`,
    data.property_name,
    data.property_address,
    data.unit_number,
    data.guest_name,
    data.phone_number,
    data.email,
    data.guest_address,
    data.monthly_rent,
    data.advanced_payment,
    data.deposit,
    data.remaining_payment,
    data.booking_date,
    data.meter_reading,
    data.meter_reading_date,
    data.notes,
    id
  );
}

export async function setNotificationId(id: number, notificationId: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE entries SET notification_id = ? WHERE id = ?', notificationId, id);
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
}
