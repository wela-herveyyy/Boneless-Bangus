ALTER TABLE `ai_message` MODIFY COLUMN `cost` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `ai_message` ADD `role` varchar(16) DEFAULT 'assistant' NOT NULL;