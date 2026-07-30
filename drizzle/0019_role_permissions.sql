ALTER TABLE `role` ADD `permissions` json;
--> statement-breakpoint
UPDATE `role` SET `permissions` = JSON_ARRAY() WHERE `permissions` IS NULL;
