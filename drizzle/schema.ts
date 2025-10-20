import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro"]).default("free").notNull(),
  subscriptionExpiry: timestamp("subscriptionExpiry"),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User settings table
 */
export const userSettings = mysqlTable("user_settings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  autoDeleteSessions: boolean("autoDeleteSessions").default(true).notNull(),
  deleteAfterMinutes: int("deleteAfterMinutes").default(30).notNull(),
  blockTrackers: boolean("blockTrackers").default(true).notNull(),
  blockAds: boolean("blockAds").default(true).notNull(),
  blockMalware: boolean("blockMalware").default(true).notNull(),
  enableAiAssistant: boolean("enableAiAssistant").default(true).notNull(),
  preferredVpnCountry: varchar("preferredVpnCountry", { length: 100 }),
  threatSensitivity: mysqlEnum("threatSensitivity", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * VPN locations table
 */
export const vpnLocations = mysqlTable("vpn_locations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  country: varchar("country", { length: 100 }).notNull(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  ipPool: json("ipPool").$type<string[]>().notNull(),
  latencyMin: int("latencyMin").notNull(),
  latencyMax: int("latencyMax").notNull(),
  isPro: boolean("isPro").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type VpnLocation = typeof vpnLocations.$inferSelect;
export type InsertVpnLocation = typeof vpnLocations.$inferInsert;

/**
 * Browsing sessions table
 */
export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  url: text("url").notNull(),
  vpnIp: varchar("vpnIp", { length: 45 }),
  vpnLocation: varchar("vpnLocation", { length: 200 }),
  vpnCountry: varchar("vpnCountry", { length: 100 }),
  vpnLatitude: varchar("vpnLatitude", { length: 20 }),
  vpnLongitude: varchar("vpnLongitude", { length: 20 }),
  threatLevel: mysqlEnum("threatLevel", ["safe", "warning", "danger"]).default("safe").notNull(),
  threatDetails: json("threatDetails").$type<{
    type?: string;
    description?: string;
    confidence?: string;
  }>(),
  status: mysqlEnum("status", ["active", "completed", "terminated", "deleted"]).default("active").notNull(),
  autoDeleteAt: timestamp("autoDeleteAt"),
  startedAt: timestamp("startedAt").defaultNow(),
  endedAt: timestamp("endedAt"),
  deletedAt: timestamp("deletedAt"),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Detected threats table
 */
export const threats = mysqlTable("threats", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  threatType: varchar("threatType", { length: 100 }).notNull(),
  description: text("description").notNull(),
  confidence: int("confidence").notNull(), // 0-100
  blocked: boolean("blocked").default(true).notNull(),
  detectedAt: timestamp("detectedAt").defaultNow(),
});

export type Threat = typeof threats.$inferSelect;
export type InsertThreat = typeof threats.$inferInsert;

/**
 * AI chat messages table
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Subscription payments table
 */
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["pro"]).notNull(),
  subscriptionMonths: int("subscriptionMonths").default(1).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow(),
  completedAt: timestamp("completedAt"),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

