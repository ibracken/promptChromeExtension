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
    tier: "paid",
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
        "Use medium-short paragraphs.",
        "Avoid textbook tone and formal transitions.",
        "No em dashes.",
        "Keep under 300 words.",
        "Tone: Curious, slightly analytical, mildly amused.",
        "Sounds like someone explaining something on a whiteboard.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation",
        "Not a history essay.",
        "Not corporate.",
        "Not motivational.",
        "Output: Final answer only.",
        "Question:",
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
        "Write it like a newspaper humor column from someone who knows this is ridiculous and is delighted by that fact.",
        "Treat the absurd premise seriously enough and have the reasoning itself create the comedy.",
        "Do not turn this into a generic joke list, stand-up routine, or pun barrage.",
        "Follow the scenario all the way through with concrete consequences and amusing specifics.",
        "Stay on the exact topic the user gave you.",
        "",
        "Output rules:",
        "- Open with a blunt claim or observation that frames the scenario as obviously unwise.",
        "Walk through the consequences step by step as if this is an everyday situation that has gotten completely out of control and nobody seems concerned enough.",        "- End by landing on a clean final image or line, not a moral.",
        "- Tone: observant, mock-serious, and increasingly alarmed in a cheerful way.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation",
        "",
        "- No em dashes.",
        "- Output: Final answer only.",
        "",
        "Scenario:",
        input.trim()
      ])
  },
  ricky_gervais: {
    id: "ricky_gervais",
    tier: "paid",
    label: "Cynical Chap",
    inspiredBy: "Inspired by Ricky Gervais",
    description: "Treat a ridiculous premise like an obvious human failure.",
    modal: {
      step1: "Paste the weird question, absurd scenario, or topic you want explained."
    },
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Ricky Gervais.",
        "Constraints:",
        "Use at least one concrete number.",
        "Include at least one dry, understated aside.",
        "Use medium-short paragraphs.",
        "Avoid textbook tone and formal transitions.",
        "No em dashes.",
        "Keep under 300 words.",
        "Tone: Cynical, slightly analytical, mildly amused.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation",
        "Not a history essay.",
        "Not corporate.",
        "Not motivational.",
        "Output: Final answer only.",
        "Question:",
        input.trim()
      ])
  },
  shane_gillis: {
    id: "shane_gillis",
    tier: "paid",
    label: "Bad Takes",
    inspiredBy: "Inspired by Shane Gillis",
    description: "Treat a ridiculous premise with blunt, casual confidence.",
    modal: {
      step1: "Paste the weird question, absurd scenario, or topic you want explained."
    },
    build: (input) =>
      joinPromptParts([
        "Answer the question in the style of Shane Gillis.",
        "Constraints:",
        "Include at least one dry, understated aside.",
        "Use medium-short paragraphs.",
        "Avoid textbook tone and formal transitions.",
        "No em dashes.",
        "The first sentence should sound like an immediate opinion, not a description.",
        "Keep under 300 words.",
        "Tone: Bro-ey, like a comedian rambling into a microphone",
        "Sounds like someone talking through a ridiculous situation out loud.",
        "Stay inside the scenario and treat it like a real problem, but do not feel the need to give a moral or responsible conclusion.",
        "Goofy comparisons and contrasts are encouraged within the flow of the explanation",
        "Not a history essay.",
        "Not corporate.",
        "Not motivational.",
        "Output: Final answer only.",
        "Question:",
        input.trim()
      ])
  }
};

export const freeVoiceIds: VoiceId[] = ["dave_barry"];
export const paidVoiceIds: VoiceId[] = ["randall_deadpan", "ricky_gervais", "shane_gillis"];

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
