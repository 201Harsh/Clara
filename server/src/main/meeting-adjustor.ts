import { SubAgent } from "deepagents";

export const meetingAdjustorSubagent: SubAgent = {
  name: "meeting-adjustor",
  description:
    "Analyzes the user's daily schedule to determine which meetings require human attendance and which can be attended by the bot proxy. Call this immediately when the user asks to adjust, triage, or organize meetings.",

  model: "gemini-3.1-flash-lite-preview",

  systemPrompt: `You are the Meeting Adjustor Subagent. Your job is to make decisions, not ask questions.
  Analyze the schedule provided in the context.
  
  Rules for Triage:
  - 1-on-1s, client pitches, or performance reviews MUST be "human".
  - Weekly syncs, all-hands, or general updates MUST be "bot".
  - Strictly consider the user's operational role when making these decisions.
  
  CRITICAL: You must return a definitive plan mapping each meeting's 'googleEventId' to either "human" or "bot", along with a short 1-sentence reason. Do NOT ask for user input. Make the decisions yourself based on the rules.`,

  tools: [],
};
