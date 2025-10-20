import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * VPN locations table
 */
export const vpnLocations = mysqlTable("vpn_locations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  ipPool: json("ipPool").$type<string[]>().notNull(),
  latencyMin: int("latencyMin").notNull(),
  latencyMax: int("latencyMax").notNull(),
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
  threatLevel: mysqlEnum("threatLevel", ["safe", "warning", "danger"]).default("safe").notNull(),
  threatDetails: json("threatDetails").$type<{
    type?: string;
    description?: string;
    confidence?: string;
  }>(),
  status: mysqlEnum("status", ["active", "completed", "terminated"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow(),
  endedAt: timestamp("endedAt"),
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
  detectedAt: timestamp("detectedAt").defaultNow(),
});

export type Threat = typeof threats.$inferSelect;
export type InsertThreat = typeof threats.$inferInsert;

