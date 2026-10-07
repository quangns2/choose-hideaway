CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`time` text,
	`guests` integer NOT NULL,
	`rooms` integer,
	`room_type` text,
	`notes` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
