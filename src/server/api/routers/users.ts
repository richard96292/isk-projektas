import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const usersRouter = createTRPCRouter({
  getUserInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });
  }),

  getAvailableTutors: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.users.findMany({
      where: eq(users.accountType, "tutor"),
      with: { languages: true, studyTypes: true, subjects: true },
    });
  }),
});
