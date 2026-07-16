CREATE TABLE `google_workspace_auth` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`refresh_token_enc` text NOT NULL,
	`access_token_enc` text,
	`refresh_token_iv` varchar(32) NOT NULL,
	`access_token_iv` varchar(32),
	`encryption_key_version` int NOT NULL DEFAULT 1,
	`token_expires_at` timestamp(3),
	`calendar_enabled` boolean NOT NULL DEFAULT true,
	`email_enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `google_workspace_auth_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_workspace_auth_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `skill` ADD `instructions` text NOT NULL;--> statement-breakpoint
ALTER TABLE `google_workspace_auth` ADD CONSTRAINT `google_workspace_auth_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `google_workspace_auth_userId_idx` ON `google_workspace_auth` (`user_id`);