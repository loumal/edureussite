import "server-only";
import { createCallerFactory, createTRPCRouter } from "@/lib/trpc/init";
import { createTRPCContext } from "@/lib/trpc/context";
import { appRouter } from "@/server/routers/_app";

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(createTRPCContext);
