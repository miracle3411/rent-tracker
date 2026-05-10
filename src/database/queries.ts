import { getDatabase } from './db';
import { Entry, EntryInput } from '../types';
import { calcNextDueDate } from '../utils/calculations';

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
      previous_reading REAL,
      current_reading REAL,
      multiplier REAL,
      payment_result REAL,
      notes TEXT,
      notification_id TEXT,
      billing_period_end TEXT,
      whatsapp_number TEXT
    );
  `);
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN deposit REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN previous_reading REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN current_reading REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN multiplier REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN payment_result REAL'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN notification_id TEXT'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN billing_period_end TEXT'); } catch {}
  try { await db.execAsync('ALTER TABLE entries ADD COLUMN whatsapp_number TEXT'); } catch {}
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
      guest_name, phone_number, whatsapp_number, email, guest_address,
      monthly_rent, advanced_payment, deposit, remaining_payment,
      booking_date, previous_reading, current_reading, multiplier, payment_result, notes,
      billing_period_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    new Date().toISOString(),
    data.property_name,
    data.property_address,
    data.unit_number,
    data.guest_name,
    data.phone_number,
    data.whatsapp_number,
    data.email,
    data.guest_address,
    data.monthly_rent,
    data.advanced_payment,
    data.deposit,
    data.remaining_payment,
    data.booking_date,
    data.previous_reading,
    data.current_reading,
    data.multiplier,
    data.payment_result,
    data.notes,
    data.billing_period_end
  );
  return result.lastInsertRowId;
}

export async function updateEntry(id: number, data: EntryInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE entries SET
      property_name = ?, property_address = ?, unit_number = ?,
      guest_name = ?, phone_number = ?, whatsapp_number = ?, email = ?, guest_address = ?,
      monthly_rent = ?, advanced_payment = ?, deposit = ?, remaining_payment = ?,
      booking_date = ?, previous_reading = ?, current_reading = ?,
      multiplier = ?, payment_result = ?, notes = ?, billing_period_end = ?
    WHERE id = ?`,
    data.property_name,
    data.property_address,
    data.unit_number,
    data.guest_name,
    data.phone_number,
    data.whatsapp_number,
    data.email,
    data.guest_address,
    data.monthly_rent,
    data.advanced_payment,
    data.deposit,
    data.remaining_payment,
    data.booking_date,
    data.previous_reading,
    data.current_reading,
    data.multiplier,
    data.payment_result,
    data.notes,
    data.billing_period_end,
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

export async function rolloverReadingsIfNeeded(entry: Entry): Promise<Entry> {
  if (!entry.booking_date || entry.current_reading == null) return entry;
  const currentCycleEnd = calcNextDueDate(entry.booking_date);
  const storedCycleEnd = entry.billing_period_end ? new Date(entry.billing_period_end) : null;
  if (storedCycleEnd && currentCycleEnd <= storedCycleEnd) return entry;
  const newPeriodEnd = currentCycleEnd.toISOString().split('T')[0];
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE entries SET previous_reading = ?, current_reading = NULL, billing_period_end = ? WHERE id = ?',
    entry.current_reading,
    newPeriodEnd,
    entry.id
  );
  return { ...entry, previous_reading: entry.current_reading, current_reading: null, billing_period_end: newPeriodEnd };
}
