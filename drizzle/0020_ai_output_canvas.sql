CREATE TABLE `ai_output_canvas` (
	`id` varchar(36) NOT NULL,
	`conversation_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`tool_mode` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`target` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` timestamp(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `ai_output_canvas_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_output_canvas_conversation_uid` UNIQUE(`conversation_id`)
);
--> statement-breakpoint
ALTER TABLE `ai_output_canvas` ADD CONSTRAINT `ai_output_canvas_conversation_id_ai_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversation`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `ai_output_canvas` ADD CONSTRAINT `ai_output_canvas_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
