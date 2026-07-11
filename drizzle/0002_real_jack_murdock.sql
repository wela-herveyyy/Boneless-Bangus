CREATE TABLE `ai_conversation` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_conversation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`row_position` int AUTO_INCREMENT NOT NULL DEFAULT 0,
	`content` text NOT NULL,
	`agent_feedback` text,
	`input_tokens` int NOT NULL DEFAULT 0,
	`output_tokens` int NOT NULL DEFAULT 0,
	`cost` decimal(10,2) NOT NULL DEFAULT '0.000000',
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `message_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_conversation` ADD CONSTRAINT `ai_conversation_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message` ADD CONSTRAINT `message_conversation_id_ai_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversation`(`id`) ON DELETE cascade ON UPDATE no action;