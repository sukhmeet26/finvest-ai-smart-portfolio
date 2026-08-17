import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z
  .object({
    totalCapital: z.number().min(10000),
    lowPct: z.number().min(0).max(100),
    moderatePct: z.number().min(0).max(100),
    highPct: z.number().min(0).max(100),
    horizonYears: z.number().min(1).max(40),
    liquidityNeedPct: z.number().min(0).max(100),
    goal: z.string().min(2).max(200),
    maxDrawdownPct: z.number().min(2).max(80),
  })
  .refine((v) => Math.abs(v.lowPct + v.moderatePct + v.highPct - 100) < 0.01, {
    message: "Risk allocation must sum to 100%",
  });

export const generatePortfolio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { buildPortfolio } = await import("./finvest/orchestrator");
    const { narratePortfolio, buildContext } = await import("./finvest/narrate.server");
    const engine = buildPortfolio(data);
    const explanation = await narratePortfolio(data, engine);
    return { input: data, ...engine, explanation, context: buildContext(data, engine) };
  });

export const generateAlternative = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { buildLowerVolatilityAlternative } = await import("./finvest/orchestrator");
    const { buildContext } = await import("./finvest/narrate.server");
    const engine = buildLowerVolatilityAlternative(data);
    return { input: data, ...engine, explanation: "", context: buildContext(data, engine) };
  });

const AskSchema = z.object({
  question: z.string().min(2).max(600),
  context: z.string().min(2),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(30)
    .default([]),
});

export const askAdvisor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskSchema.parse(input))
  .handler(async ({ data }) => {
    const { answerQuestion } = await import("./finvest/narrate.server");
    return { answer: await answerQuestion(data.question, data.context, data.history) };
  });