CREATE TABLE `team` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`code` varchar(6) NOT NULL,
	`manager_id` varchar(36) NOT NULL,
	`cursor_api_key` text,
	`gemini_api_key` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `team_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`cursor_api_key` text,
	`gemini_api_key` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_team` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`team_id` varchar(36) NOT NULL,
	`joined_at` timestamp(3) NOT NULL DEFAULT (now()),
	`left_at` timestamp(3),
	CONSTRAINT `user_team_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `google_workspace_auth` ADD `meet_enabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `team` ADD CONSTRAINT `team_manager_id_user_id_fk` FOREIGN KEY (`manager_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_team` ADD CONSTRAINT `user_team_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_team` ADD CONSTRAINT `user_team_team_id_team_id_fk` FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON DELETE cascade ON UPDATE no action;