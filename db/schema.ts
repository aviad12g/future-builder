import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const journeys=sqliteTable('journeys',{userId:text('user_id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),updated:text('updated').notNull()});
export const githubTokens=sqliteTable('github_tokens',{userId:text('user_id').primaryKey(),encrypted:text('encrypted').notNull(),login:text('login').notNull(),updated:text('updated').notNull()});
export const oauthStates=sqliteTable('oauth_states',{state:text('state').primaryKey(),userId:text('user_id').notNull(),verifier:text('verifier').notNull(),expires:integer('expires').notNull()});
export const marketSnapshots=sqliteTable('market_snapshots',{id:text('id').primaryKey(),userId:text('user_id').notNull(),date:text('date').notNull(),payload:text('payload').notNull()},t=>[index('idx_market_user_date').on(t.userId,t.date)]);
