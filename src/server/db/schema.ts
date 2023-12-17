import { relations, sql } from "drizzle-orm";
import {
  bigint,
  index,
  int,
  mysqlTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { type AdapterAccount } from "next-auth/adapters";

export const mysqlTable = mysqlTableCreator((name) => `isk_projektas_${name}`);

export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // NOTE: not null added manually
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  image: varchar("image", { length: 255 }),
  accountType: varchar("accountType", { length: 255 }), // student, tutor
});

export const students = mysqlTable("students", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 255 }),
  studyYear: int("studyYear"),
  averageGrade: int("averageGrade"),
});

export const tutors = mysqlTable("tutors", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 255 }),
  description: text("description"),
  pricePerHour: int("pricePerHour"),
  isAvailable: int("isAvailable"),
});

// if tutor has an entry here - he is teaching this subject
// if student has an entry here - he wants to learn this subject
export const userSubjects = mysqlTable("user_subject", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: varchar("userId", { length: 255 }).notNull(),
  subjectId: bigint("subjectId", { mode: "number" }).notNull(),
});

// makes it hard to test
// export const userSubjectsRelations = relations(userSubjects, ({ one }) => ({
//   user: one(users, { fields: [userSubjects.userId], references: [users.id] }),
//   subject: one(subjects, {
//     fields: [userSubjects.subjectId],
//     references: [subjects.id],
//   }),
// }));

export const subjects = mysqlTable("subject", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index("userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = mysqlTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = mysqlTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);

export const reservations = mysqlTable("reservation", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  studentId: varchar("studentId", { length: 255 }).notNull(),
  tutorId: varchar("tutorId", { length: 255 }).notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const reservationsRelations = relations(reservations, ({ one }) => ({
  student: one(users, {
    fields: [reservations.studentId],
    references: [users.id],
  }),
  tutor: one(users, { fields: [reservations.tutorId], references: [users.id] }),
}));

export const reviews = mysqlTable("review", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  reservationId: bigint("reservationId", { mode: "number" }).notNull(),
  tutorId: varchar("tutorId", { length: 255 }).notNull(),
  studentId: varchar("studentId", { length: 255 }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reviews.reservationId],
    references: [reservations.id],
  }),
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
  }),
  tutor: one(users, { fields: [reviews.tutorId], references: [users.id] }),
}));
