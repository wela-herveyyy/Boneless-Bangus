CREATE TABLE `skill` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_category` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `skill_category_id` PRIMARY KEY(`id`),
	CONSTRAINT `skill_category_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `skill` ADD CONSTRAINT `skill_category_id_skill_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `skill_category`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill` ADD CONSTRAINT `skill_author_id_user_id_fk` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;