CREATE TABLE `Bout` (
	`bout_id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`boxer_a_id` integer,
	`boxer_a_name` text NOT NULL,
	`boxer_b_id` integer,
	`boxer_b_name` text NOT NULL,
	`status` text NOT NULL,
	`winner` text,
	`method_of_victory` text,
	`total_rounds` integer,
	`scheduled_rounds` integer NOT NULL,
	`weight_class` text NOT NULL,
	`weight_lb` text NOT NULL,
	`location_id` integer,
	`location_venue` text,
	FOREIGN KEY (`boxer_a_id`) REFERENCES `Champion`(`champion_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`boxer_b_id`) REFERENCES `Champion`(`champion_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `Location`(`location_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `BoutTitle` (
	`bout_id` integer NOT NULL,
	`title_id` integer NOT NULL,
	`weight_lb` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`bout_id`) REFERENCES `Bout`(`bout_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`title_id`) REFERENCES `Title`(`title_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Champion` (
	`champion_id` integer PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`short_name` text NOT NULL,
	`born` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Location` (
	`location_id` integer PRIMARY KEY NOT NULL,
	`latest_venue_name` text NOT NULL,
	`locality` text NOT NULL,
	`country` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Reference` (
	`reference_id` integer PRIMARY KEY NOT NULL,
	`headline` text NOT NULL,
	`author` text,
	`publication` text NOT NULL,
	`publication_date` text NOT NULL,
	`bout_id` integer,
	`reign_id` integer,
	`event_date` text NOT NULL,
	`link_text` text NOT NULL,
	`link` text NOT NULL,
	FOREIGN KEY (`bout_id`) REFERENCES `Bout`(`bout_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reign_id`) REFERENCES `Reign`(`reign_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Reign` (
	`reign_id` integer PRIMARY KEY NOT NULL,
	`begins` text NOT NULL,
	`ends` text,
	`champion_id` integer NOT NULL,
	`name` text NOT NULL,
	`is_current_champion` integer NOT NULL,
	`title_id` integer NOT NULL,
	`weight_lb` text NOT NULL,
	FOREIGN KEY (`champion_id`) REFERENCES `Champion`(`champion_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`title_id`) REFERENCES `Title`(`title_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Title` (
	`title_id` integer PRIMARY KEY NOT NULL,
	`org_full_name` text NOT NULL,
	`org_short_name` text NOT NULL,
	`org_abbreviation` text NOT NULL,
	`active` integer NOT NULL,
	`weight_class` text NOT NULL,
	`latest_weight_lb` text NOT NULL
);
