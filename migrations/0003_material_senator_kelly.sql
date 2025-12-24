CREATE TABLE `mockboard_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`options` text NOT NULL,
	`correct_answer` integer NOT NULL,
	`subject` text NOT NULL,
	`set` integer,
	`imported_at` integer DEFAULT (unixepoch())
);
