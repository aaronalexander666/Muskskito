CREATE TABLE `chat_messages` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`subscriptionTier` enum('pro') NOT NULL,
	`subscriptionMonths` int NOT NULL DEFAULT 1,
	`paymentMethod` varchar(50),
	`createdAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`autoDeleteSessions` boolean NOT NULL DEFAULT true,
	`deleteAfterMinutes` int NOT NULL DEFAULT 30,
	`blockTrackers` boolean NOT NULL DEFAULT true,
	`blockAds` boolean NOT NULL DEFAULT true,
	`blockMalware` boolean NOT NULL DEFAULT true,
	`enableAiAssistant` boolean NOT NULL DEFAULT true,
	`preferredVpnCountry` varchar(100),
	`threatSensitivity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `status` enum('active','completed','terminated','deleted') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `sessions` ADD `vpnCountry` varchar(100);--> statement-breakpoint
ALTER TABLE `sessions` ADD `vpnLatitude` varchar(20);--> statement-breakpoint
ALTER TABLE `sessions` ADD `vpnLongitude` varchar(20);--> statement-breakpoint
ALTER TABLE `sessions` ADD `autoDeleteAt` timestamp;--> statement-breakpoint
ALTER TABLE `sessions` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `threats` ADD `blocked` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','pro') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `vpn_locations` ADD `countryCode` varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `vpn_locations` ADD `latitude` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `vpn_locations` ADD `longitude` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `vpn_locations` ADD `isPro` boolean DEFAULT false NOT NULL;