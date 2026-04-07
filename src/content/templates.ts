export type VoiceId =
  | "randall_deadpan"
  | "dave_barry"
  | "ricky_gervais"
  | "shane_gillis";

type Tier = "free" | "paid";

export type ModalAnswers = {
  scenario: string;
};

type ModalConfig = {
  step1: string;
};

type VoiceConfig = {
  id: VoiceId;
  tier: Tier;
  label: string;
  inspiredBy: string;
  description: string;
  modal: ModalConfig;
  build: (input: string) => string;
};

function joinPromptParts(parts: string[]) {
  return parts.join("\n");
}

function buildComedyPrompt(options: {
  voice: string;
  opening: string;
  tone: string;
  structure: string[];
  constraints?: string[];
  maxWords?: number;
  input: string;
}) {
  const parts = [
    `Answer the scenario in the style of ${options.voice}.`,
    options.opening,
    "Treat the absurd premise seriously enough that the reasoning itself creates the comedy.",
    "Do not turn this into a generic joke list, stand-up routine, or pun barrage.",
    "Follow the scenario all the way through with concrete consequences and specifics.",
    "",
    "Output rules:",
    ...options.structure.map((rule) => `- ${rule}`),
    `- Tone: ${options.tone}.`,
    ...(options.constraints ?? []).map((rule) => `- ${rule}`),
    ...(options.maxWords ? [`- Keep under ${options.maxWords} words.`] : []),
    "- Output: Final answer only.",
    "",
    "Scenario:",
    options.input.trim()
  ];
  return joinPromptParts(parts);
}

const voices: Record<VoiceId, VoiceConfig> = {
  randall_deadpan: {
    id: "randall_deadpan",
    tier: "free",
    label: "Deadpan Lab",
    inspiredBy: "Inspired by Randall Munroe",
    description: "Treat a ridiculous premise like a real whiteboard problem.",
    modal: {
      step1: "Paste the weird question, absurd scenario, or topic you want explained."
    },
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Randall Munroe from xkcd and What If.",
        "Constraints:",
        "Use at least one concrete number.",
        "Include at least one dry, understated aside.",
        "Add at least one absurd but concrete comparison.",
        "No em dashes or emojis.",
        "Keep under 300 words.",
        "Tone: Curiosity with a playful and slightly derailed attitude.",
        "Sounds like someone calmly overcommitted to explaining something on a whiteboard.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation",
        "Output: Final answer only.",
        "Hypothetical Scenario:",
        input.trim()
      ])
  },
  dave_barry: {
    id: "dave_barry",
    tier: "free",
    label: "Chaos Column",
    inspiredBy: "Inspired by Dave Barry",
    description: "Escalate a bad idea with confident, newspaper-column energy.",
    modal: {
      step1: "Paste the absurd scenario or question you want analyzed."
    },
    build: (input) =>
      joinPromptParts([
        "Answer the scenario in the style of Dave Barry.",
        "Write it like an excerpt from Bad Habits where he knows this is ridiculous and is delighted by that fact.",
        "Spend very little time explaining the premise and most of the answer describing what actually happens because of it.",
        "- Open with a Title for the piece with appropriate formatting",
        "- Tone: personally exasperated, and increasingly alarmed in a cheerful way.",
        "- No em dashes or emojis.",
        "- Output: Final answer only.",
        "Hypothetical Scenario:",
        input.trim()
      ])
  },
  ricky_gervais: {
    id: "ricky_gervais",
    tier: "free",
    label: "Cynical Chap",
    inspiredBy: "Inspired by Ricky Gervais",
    description: "Treat a ridiculous premise like an obvious human failure.",
    modal: {
      step1: "Paste the weird question, absurd scenario, or topic you want explained."
    },
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Ricky Gervais.",
        "Speak like someone instantly annoyed that this scenario even exists, but amused by how stupid it is.",
        "This should feel like the comedian talking through an obvious human failure, not like an essay or whiteboard explanation.",
        "Start with an immediate judgment, not scene-setting.",
        "Keep pushing on the hypocrisy, laziness, ego, or stupidity inside the premise.",
        "Use at least one concrete example.",
        "No em dashes or emojis.",
        "Keep under 300 words.",
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
    label: "Bad Takes",
    inspiredBy: "Inspired by Shane Gillis",
    description: "Treat a ridiculous premise with blunt, casual confidence.",
    modal: {
      step1: "Paste the weird question, absurd scenario, or topic you want explained."
    },
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Shane Gillis.",
        "It should sound like a comedian informally talking through a ridiculous situation out loud.",
        "Start with an immediate opinion, not an explanation.",
        "Keep under 250 words.",
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
  "shane_gillis",
  "randall_deadpan",
  "dave_barry",
  "ricky_gervais"
];
export const paidVoiceIds: VoiceId[] = [];

export function getVoice(id: VoiceId) {
  return voices[id];
}

export function getAllVoices() {
  return [...freeVoiceIds, ...paidVoiceIds].map((id) => voices[id]);
}

export function getModalConfig(id: VoiceId) {
  return voices[id].modal;
}

export function buildModalInput(id: VoiceId, answers: ModalAnswers) {
  return answers.scenario.trim();
}

export function buildPrompt(id: VoiceId, input: string) {
  return voices[id].build(input);
}
