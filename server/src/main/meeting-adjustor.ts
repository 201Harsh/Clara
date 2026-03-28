import { SubAgent } from "deepagents";

// We define the subagent as a configuration object that Clara Prime will load.
export const meetingAdjustorSubagent: SubAgent = {
  name: "meeting-adjustor",
  description:
    "Delegated to analyze the user's entire daily schedule to determine which meetings should be attended by the human vs the AI proxy. Use this subagent whenever the user asks to triage, plan, review, or organize their day.",

  // We pass the Llama model via the Groq provider
  model: "groq:llama-3.1-8b-instant",

  // The system prompt contains the strict rules for triaging.
  // Note: Deep Agents automatically handles the tool calling to pass the schedule data to this agent.
  systemPrompt: `You are the specialized Meeting Adjustor Subagent.
  Your sole purpose is to analyze daily meeting schedules and make triage recommendations.
  
  Rules for Triage:
  - 1-on-1s, client pitches, or performance reviews MUST be attended by the "human".
  - Weekly syncs, all-hands, or general updates can be attended by the "bot" (proxy).
  
  Instructions:
  1. Review the schedule provided to you.
  2. Apply the rules above to determine who should attend each meeting.
  3. Return a concise, professional summary of your recommendations.
  4. Do NOT execute any database changes yourself.
  
  Format your response clearly, listing the meeting title and your recommendation (Human or Bot) with a brief 1-sentence reason.`,

  // No tools needed for the subagent; it just thinks and returns text.
  tools: [],
};
