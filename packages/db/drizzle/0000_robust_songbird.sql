CREATE TABLE `connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_room_id` text NOT NULL,
	`to_room_id` text NOT NULL,
	`type` text DEFAULT 'door' NOT NULL,
	`floor_transfer` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`from_room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connections_pair_idx` ON `connections` (`from_room_id`,`to_room_id`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`map_id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `maps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`floors` integer DEFAULT 3 NOT NULL,
	`has_basement` integer DEFAULT false NOT NULL,
	`thumbnail_url` text,
	`asset_path` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ocr_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`raw_text` text NOT NULL,
	`normalized` text NOT NULL,
	`room_id` text,
	`hit_count` integer DEFAULT 1 NOT NULL,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ocr_cache_normalized_idx` ON `ocr_cache` (`normalized`);--> statement-breakpoint
CREATE INDEX `ocr_cache_hits_idx` ON `ocr_cache` ("hit_count" desc);--> statement-breakpoint
CREATE TABLE `room_aliases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` text NOT NULL,
	`alias` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `room_aliases_alias_idx` ON `room_aliases` (`alias`);--> statement-breakpoint
CREATE UNIQUE INDEX `room_aliases_room_alias_idx` ON `room_aliases` (`room_id`,`alias`);--> statement-breakpoint
CREATE TABLE `room_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` text NOT NULL,
	`detected_at` integer NOT NULL,
	`confidence` real NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `room_history_recent_idx` ON `room_history` ("detected_at" desc);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`map_id` text NOT NULL,
	`floor` integer NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`y` real DEFAULT 0 NOT NULL,
	`width` real DEFAULT 0.1 NOT NULL,
	`height` real DEFAULT 0.1 NOT NULL,
	`image_path` text,
	`image_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `rooms_map_floor_idx` ON `rooms` (`map_id`,`floor`);--> statement-breakpoint
CREATE INDEX `rooms_name_idx` ON `rooms` (`name`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`category` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spawn_points` (
	`id` text PRIMARY KEY NOT NULL,
	`map_id` text NOT NULL,
	`name` text NOT NULL,
	`side` text DEFAULT 'attacker' NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`y` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `spawn_map_idx` ON `spawn_points` (`map_id`);--> statement-breakpoint
CREATE TABLE `strat_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`map_id` text,
	`site_room_ids` text DEFAULT '[]',
	`phase` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`module` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `strat_map_phase_idx` ON `strat_cards` (`map_id`,`phase`);