CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`question_ids` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
