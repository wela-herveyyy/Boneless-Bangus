CREATE TABLE `user_installed_skill` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`skill_id` varchar(36) NOT NULL,
	`installed_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `user_installed_skill_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_skill_unique_idx` UNIQUE(`user_id`,`skill_id`)
);
--> statement-breakpoint
ALTER TABLE `skill` ADD `is_global` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_installed_skill` ADD CONSTRAINT `user_installed_skill_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_installed_skill` ADD CONSTRAINT `user_installed_skill_skill_id_skill_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON DELETE cascade ON UPDATE no action;