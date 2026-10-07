import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey(), kind: text('kind').notNull(),
  name: text('name').notNull(), phone: text('phone').notNull(), email: text('email'),
  startDate: text('start_date').notNull(), endDate: text('end_date'), time: text('time'),
  guests: integer('guests').notNull(), rooms: integer('rooms'), roomType: text('room_type'),
  notes: text('notes'), status: text('status').notNull().default('pending'), createdAt: text('created_at').notNull(),
});
