RENAME TABLE `message` TO `ai_message`;--> statement-breakpoint
ALTER TABLE `ai_message` DROP FOREIGN KEY `message_conversation_id_ai_conversation_id_fk`;
--> statement-breakpoint
ALTER TABLE `ai_message` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ai_message` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ai_message` ADD CONSTRAINT `ai_message_conversation_id_ai_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversation`(`id`) ON DELETE cascade ON UPDATE no action;