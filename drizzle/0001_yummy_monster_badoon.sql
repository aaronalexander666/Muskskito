CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`url` text NOT NULL,
	`vpnIp` varchar(45),
	`vpnLocation` varchar(200),
	`threatLevel` enum('safe','warning','danger') NOT NULL DEFAULT 'safe',
	`threatDetails` json,
	`status` enum('active','completed','terminated') NOT NULL DEFAULT 'active',
	`startedAt` timestamp DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `threats` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`threatType` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`confidence` int NOT NULL,
	`detectedAt` timestamp DEFAULT (now()),
	CONSTRAINT `threats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vpn_locations` (
	`id` varchar(64) NOT NULL,
	`country` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`ipPool` json NOT NULL,
	`latencyMin` int NOT NULL,
	`latencyMax` int NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `vpn_locations_id` PRIMARY KEY(`id`)
);
