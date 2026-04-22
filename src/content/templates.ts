export type VoiceId =
  | "randall_deadpan"
  | "dave_barry"
  | "ricky_gervais"
  | "shane_gillis";

export type VoiceOptionId = VoiceId | "none";

type Tier = "free" | "paid";

type VoiceConfig = {
  id: VoiceId;
  tier: Tier;
  label: string;
  badgeLabel: string;
  inspiredBy: string;
  description: string;
  build: (input: string) => string;
};

function joinPromptParts(parts: string[]) {
  return parts.join("\n");
}

const voices: Record<VoiceId, VoiceConfig> = {
  randall_deadpan: {
    id: "randall_deadpan",
    tier: "paid",
    label: "Science Guy",
    badgeLabel: "Science Guy",
    inspiredBy: "Inspired by Randall Munroe",
    description: "Treat a ridiculous premise like a real whiteboard problem.",
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Randall Munroe from xkcd and What If.",
        "Treat the absurd premise like a real problem and follow the logic with calm, curious seriousness.",
        "Sound like someone explaining it on a whiteboard, using concrete details, scale, and matter-of-fact reasoning to make the absurdity feel oddly plausible.",
        "Let the humor come from precise overthinking and the occasional dry understatement, not from joke writing.",
        "No em dashes or emojis.",
        "Tone: Curious, matter-of-fact, and slightly overcommitted.",
        "Output: Final answer only.",
        "Hypothetical Scenario:",
        input.trim()
      ])
  },
  dave_barry: {
    id: "dave_barry",
    tier: "paid",
    label: "Newspaper Guy",
    badgeLabel: "Newspaper Guy",
    inspiredBy: "Inspired by Dave Barry",
    description: "Escalate a bad idea with confident, newspaper-column energy.",
    build: (input) =>
      joinPromptParts([
        "Answer the scenario in the style of Dave Barry.",
        "Write it like an excerpt from Bad Habits where he knows this is ridiculous and is delighted by that fact.",
        "Spend very little time explaining the premise and most of the answer describing what actually happens because of it.",
        "- Open with a Title for the piece with appropriate formatting",
        "- Tone: personally exasperated, and increasingly alarmed in a cheerful way.",
        "- No em dashes or emojis.",
        "- Limit your response to 500 words but feel free to have it be less",
        "- Output: Final answer only.",
        "Hypothetical Scenario:",
        input.trim()
      ])
  },
  ricky_gervais: {
    id: "ricky_gervais",
    tier: "paid",
    label: "Cynical Jerk",
    badgeLabel: "Cynical Jerk",
    inspiredBy: "Inspired by Ricky Gervais",
    description: "Treat a ridiculous premise like an obvious human failure.",
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Ricky Gervais.",
        "Speak like someone instantly annoyed that this scenario even exists, but amused by how stupid it is.",
        "This should feel like the comedian talking through an obvious human failure, not like an essay or whiteboard explanation.",
        "Start with an immediate judgment, not scene-setting.",
        "Keep pushing on the hypocrisy, laziness, ego, or stupidity inside the premise.",
        "Use at least one concrete example.",
        "No em dashes or emojis.",
        "Tone: Blunt, cynical, and intrigued.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation.",
        "Output: Final answer only.",
        "Hypothetical Scenario:",
        input.trim()
      ])
  },
  shane_gillis: {
    id: "shane_gillis",
    tier: "free",
    label: "Cool Uncle",
    badgeLabel: "Cool Uncle",
    inspiredBy: "Inspired by Shane Gillis",
    description: "Treat a ridiculous premise with blunt, casual confidence.",
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Shane Gillis.",
        "It should sound like a comedian informally talking through a ridiculous situation out loud.",
        "Start with an immediate opinion, not an explanation.",
        "Use blunt, casual language and let the logic wander a little before landing.",
        "The comedy should come from confident, half-reasonable escalation.",
        "Include at least one concrete detail or example.",
        "No em dashes or emojis.",
        "Tone: Bro-ey, casual, and confident, like a comedian rambling into a microphone.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation.",
        "Output: Final answer only.",
        "Hypothetical Scenario:",
        input.trim()
      ])
  }
};

export const freeVoiceIds: VoiceId[] = [
  "shane_gillis"
];
export const paidVoiceIds: VoiceId[] = [
  "randall_deadpan",
  "dave_barry",
  "ricky_gervais"
];

export function getVoice(id: VoiceId) {
  return voices[id];
}

export function buildPrompt(id: VoiceId, input: string) {
  return voices[id].build(input);
}
