CREATE TABLE `role` (
	`id` varchar(36) NOT NULL,
	`value` varchar(50) NOT NULL,
	`label` varchar(100) NOT NULL,
	`hint` text,
	`description` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `role_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_value_unique` UNIQUE(`value`)
);
--> statement-breakpoint
ALTER TABLE `user` ADD `role_id` varchar(36);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_role_id_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE set null ON UPDATE no action;