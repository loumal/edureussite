import { createTRPCRouter } from "@/lib/trpc/init";
import { eleveRouter } from "./eleve";
import { exerciceRouter } from "./exercice";
import { parentRouter } from "./parent";
import { authRouter } from "./auth";
import { enseignantRouter } from "./enseignant";
import { adminRouter } from "./admin";
import { coursRouter } from "./cours";
import { specialisteRouter } from "./specialiste";
import { gamificationRouter } from "./gamification";
import { surpriseRouter } from "./surprise";
import { planRouter } from "./plan";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  eleve: eleveRouter,
  exercice: exerciceRouter,
  parent: parentRouter,
  enseignant: enseignantRouter,
  admin: adminRouter,
  cours: coursRouter,
  specialiste: specialisteRouter,
  gamification: gamificationRouter,
  surprise: surpriseRouter,
  plan: planRouter,
});

export type AppRouter = typeof appRouter;
