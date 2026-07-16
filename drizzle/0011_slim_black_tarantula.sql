CREATE TABLE `mcp_credential` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`encrypted_value` text NOT NULL,
	`iv` varchar(32) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `mcp_credential_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mcp_credential` ADD CONSTRAINT `mcp_credential_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mcp_credential_userId_idx` ON `mcp_credential` (`user_id`);