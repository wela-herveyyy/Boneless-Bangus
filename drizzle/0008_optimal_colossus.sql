CREATE TABLE `mcp_category` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `mcp_category_id` PRIMARY KEY(`id`),
	CONSTRAINT `mcp_category_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `mcp_server` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`config_template` json NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `mcp_server_id` PRIMARY KEY(`id`),
	CONSTRAINT `mcp_server_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `mcp_server_tool` (
	`id` varchar(36) NOT NULL,
	`mcp_server_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`input_schema` json,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `mcp_server_tool_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mcp_server` ADD CONSTRAINT `mcp_server_category_id_mcp_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `mcp_category`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mcp_server` ADD CONSTRAINT `mcp_server_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mcp_server_tool` ADD CONSTRAINT `mcp_server_tool_mcp_server_id_mcp_server_id_fk` FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mcp_category_slug_idx` ON `mcp_category` (`slug`);--> statement-breakpoint
CREATE INDEX `mcp_server_slug_idx` ON `mcp_server` (`slug`);--> statement-breakpoint
CREATE INDEX `mcp_server_categoryId_idx` ON `mcp_server` (`category_id`);--> statement-breakpoint
CREATE INDEX `mcp_server_userId_idx` ON `mcp_server` (`user_id`);--> statement-breakpoint
CREATE INDEX `mcp_server_tool_serverId_idx` ON `mcp_server_tool` (`mcp_server_id`);