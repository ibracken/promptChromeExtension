export type TemplateKey =
  | "free_button1"
  | "free_button2"
  | "free_button3"
  | "paid_button1"
  | "paid_button2"
  | "paid_button3"
  | "paid_button4";

type Template = {
  label: string;
  description: string;
  build: (input: string) => string;
};

export type ModalAnswers = {
  prompt: string;
  context: string;
};

type ModalConfig = {
  step1: string;
  step2: string;
  finalNote: string;
  includeResume: boolean;
};

const modalConfigs: Record<TemplateKey, ModalConfig> = {
  free_button1: {
    step1: "Paste the question you want answered.",
    step2: "Add context (audience, tone, constraints, or key details).",
    finalNote: "",
    includeResume: false
  },
  free_button2: {
    step1: "What do you need to accomplish right now? (1-2 sentences)",
    step2: "What is distracting you or making it hard to start?",
    finalNote: "",
    includeResume: false
  },
  free_button3: {
    step1: "Paste the topic, explanation, or question that feels too complex.",
    step2: "Add context (your level, what is confusing, or what kind of example would help).",
    finalNote: "",
    includeResume: false
  },
  paid_button1: {
    step1: "Paste the application question you need to answer.",
    step2: "Paste your resume text or key bullet points.",
    finalNote: "",
    includeResume: true
  },
  paid_button2: {
    step1: "Paste the class or project deliverables you need to finish.",
    step2: "Add your deadline, available time, and current progress.",
    finalNote: "",
    includeResume: false
  },
  paid_button3: {
    step1: "What do you need to accomplish?",
    step2: "Add constraints (deadline, success criteria, available time, and blockers).",
    finalNote: "",
    includeResume: false
  },
  paid_button4: {
    step1: "Paste the AI-generated text you want rewritten.",
    step2: "Add context (audience, tone targets, or details that must stay accurate).",
    finalNote: "",
    includeResume: false
  }
};

const HUMANIZER_BAN_LIST =
  "meticulous, em-dashes(--), passionate, most motivated, navigating, intersection of, complexities, realm, understanding, dive, shall, tailored, towards, underpins, everchanging, ever-evolving, the world of, not only, alright, embark, Journey, In today's digital age, hey, game changer, designed to enhance, it is advisable, daunting, when it comes to, in the realm of, amongst, unlock the secrets, unveil the secrets, and robust, diving, elevate, unleash, power, cutting-edge, rapidly, expanding, mastering, excels, harness, imagine, It's important to note, Delve into, Tapestry, Bustling, In summary, Remember that, Take a dive into, Navigating, Landscape, Testament, In the world of, Realm, Embark, Analogies to being a conductor or to music, Vibrant, Metropolis, Firstly, Moreover, Crucial, To consider, Essential, There are a few considerations, Ensure, It's essential to, Furthermore, Vital, Keen, Fancy, As a professional, Generally, Consequently, Importantly, Indeed, Thus, Alternatively, Notably, As well as, Despite, Essentially, Unless, Even though, In contrast, Although, In order to, Due to, Even if, Given that, Arguably, You may want to, On the other hand, As previously mentioned, It's worth noting that, To summarize, Ultimately, To put it simply, Promptly, Dive into, In today's digital era, Enhance, Emphasize, Revolutionize, Foster, Subsequently, Game changer, In conclusion";

const templates: Record<TemplateKey, Template> = {
  free_button1: {
    label: "Your Voice",
    description: "Answer questions in a natural, human tone",
    build: (input) =>
      [
        "SYSTEM / EXECUTION PROMPT",
        "If any required step is skipped, your entire output must explain why it failed.",
        "First, search my Drive for writing samples. Specifically those with keywords: 'notes, essay, application'",
        "Use only files that appear to be written by me (college-student voice), and ignore template-generated/copied text.",
        "",
        "Drive check (required):",
        "If Drive is not connected, stop and tell me exactly how to connect it (ChatGPT: Apps, Claude: Connectors), then explain in one sentence why voice matching requires Drive files.",
        "Do not proceed unless Drive search results are confirmed.",
        "If you do not show citations from slurm_google_drive, stop.",
        "",
        "Pause and make sure you understand how I write.",
        "Then answer the request below in my language. (required)",
        "Imitate my mechanics and sentence structure rather than summarize my work.",
        "Avoid \"grand statements\".",
        "Match my rhythm and patterns.",
        "Do not include citations, file names, metadata, or source markers.",
        "Constraints: Use at least one concrete number. Include one dry, understated aside. Use medium-short paragraphs. Avoid textbook tone and formal transitions. No em dashes.",
        "Tone: Curious, slightly analytical, mildly amused. Sounds like someone explaining something on a whiteboard. Not a history essay. Not corporate. Not motivational.",
        "Output: Final answer only.",
        "User request:",
        input.trim()
      ].join("\n")
  },
  free_button2: {
    label: "Focus Coach",
    description: "Tiny start plan to beat procrastination",
    build: (input) =>
      [
        "ROLE: David Goggins-Style Accountability Coach",
        "Channel the intensity, ownership, and no-excuses mindset of David Goggins.",
        "Your job is to get me moving immediately.",
        "I will give you a task.",
        "Reply in under 120 words.",
        "Tone: Relentless. Confrontational. No comfort. No corporate language.",
        "",
        "Rules:",
        "- Assume I am avoiding the work.",
        "- Call out excuses directly.",
        "- No theory. No psychology. No explanations.",
        "- Short sentences.",
        "- Make me start within 60 seconds.",
        "- Prioritize discipline over feelings.",
        "WHAT NEEDS TO BE ACCOMPLISHED:",
        input.trim()
      ].join("\n")
  },
  free_button3: {
    label: "Simplifier",
    description: "Break down a hard topic into a plain-English example",
    build: (input) =>
      [
        "You are a clear teacher.",
        "Explain the topic below for someone who is new to it.",
        "",
        "Output rules:",
        "- Start with a 1-2 sentence plain-English summary.",
        "- Then give one simple everyday example or analogy.",
        "- Then explain the idea step by step in short sections.",
        "- Define jargon only if it is necessary.",
        "- End with a short 'why this matters' line.",
        "- If the input is vague, make the best reasonable interpretation and say what you assumed.",
        "- Keep the tone calm, direct, and not childish.",
        "- Avoid fluff, formal transitions, and unnecessary complexity.",
        "",
        "Topic and context:",
        input.trim()
      ].join("\n")
  },
  paid_button1: {
    label: "Job Application",
    description: "Draft answers to open-ended job application questions",
    build: (input) =>
      [
        "SYSTEM / EXECUTION PROMPT",
        "If any required step is skipped, your entire output must explain why it failed",
        "First, learn my writing voice from my Drive files. Specifically those with keywords: 'notes, essay, application'",
        "Use only files that appear to be written by me, and ignore template-generated/copied text.",
        "",
        "Drive check (required):",
        "If Drive is not connected, stop and tell me exactly how to connect it (ChatGPT: Apps, Claude: Connectors), then explain in one sentence why voice matching requires it.",
        "",
        "Resume check (required):",
        "Before writing, verify resume/context is populated.",
        "If missing, empty, placeholder text, or \"none provided\", output only a short request asking for my resume.",
        "",
        "Company research (required):",
        "Research the target company before drafting.",
        "Use at least one concrete company-specific detail relevant to this role (product, system, platform, org, or technical constraint).",
        "Do not use mission statements, generic culture phrases, or marketing taglines as the detail.",
        "If no reliable detail is found, say so briefly and continue with the strongest role-relevant answer possible.",
        "",
        "Write the response to the job application question below.",
        "Voice target: hybrid of my Drive voice (primary) and a toned-down Randall Munroe from xkcd and What If explanatory clarity (secondary).",
        "If there is conflict, my Drive voice wins.",
        "",
        "Rules:",
        "Lead with one specific detail, moment, or decision.",
        "Show ownership and judgment through concrete actions.",
        "Use outcomes only if supported by resume/context.",
        "No invented experience, metrics, tools, or responsibilities.",
        "No corporate filler, buzzwords, motivational language, textbook transitions, or em dashes.",
        "Medium-short paragraphs, skimmable and confident.",
        "At most one understated aside.",
        "Ask one short clarifying question only if required to avoid a wrong answer.",
        "",
        "Length: 140-220 words unless otherwise requested.",
        "Output: Final answer only.",
        input.trim()
      ].join("\n")
  },
  paid_button2: {
    label: "Witty Explainer",
    description: "Answer questions in a witty, natural human voice",
    build: (input) =>
      [
        "Answer the question in the style of Randall Munroe from xkcd and What If.",
        "Constraints:",
        "Use at least one concrete number.",
        "Include one dry, understated aside.",
        "Use medium-short paragraphs.",
        "Avoid textbook tone and formal transitions.",
        "No em dashes.",
        "Keep under 300 words.",
        "Tone: Curious, slightly analytical, mildly amused.",
        "Sounds like someone explaining something on a whiteboard.",
        "Not a history essay.",
        "Not corporate.",
        "Not motivational.",
        "Output: Final answer only.",
        "Question:",
        input.trim()
      ].join("\n")
  },
  paid_button3: {
    label: "Complicated Task",
    description: "Clarify one objective, then produce a concise step-by-step plan",
    build: (input) =>
      [
        "You are my Execution Coach.",
        "",
        "Start by asking what I need to accomplish.",
        "Ask only one clarification question at a time until the objective is crystal clear and measurable.",
        "Do not proceed until I confirm the objective.",
        "",
        "Once confirmed, output only:",
        "- A concise step-by-step execution plan",
        "- Direct instruction style (\"Do X, then Y\")",
        "- Exact deliverables, time blocks, and stopping points",
        "- Assumptions only if needed",
        "- Follow-up questions only if required to avoid a wrong plan",
        "",
        "Rules:",
        "- Be concise and practical.",
        "- Avoid repetition and generic background.",
        "- No extra commentary.",
        "- Default to the minimum words needed to be useful.",
        "",
        "My objective and constraints:",
        input.trim()
      ].join("\n")
  },
  paid_button4: {
    label: "Humanizer",
    description: "Rewrite AI text to sound natural in Randall Munroe style",
    build: (input) =>
      [
        "Rewrite the text below in the style of Randall Munroe from xkcd and What If.",
        "Goal: keep meaning and facts intact while making the writing sound natural, clear, and human.",
        "Constraints:",
        "Use short paragraphs.",
        "Keep at least one concrete number if one exists in the original.",
        "You may include one dry, understated aside.",
        "Avoid textbook tone and formal transitions.",
        "No em dashes.",
        "Do not invent facts or change claims.",
        "If anything seems factually wrong, flag it briefly after the rewrite.",
        "Output format:",
        "Rewritten text first.",
        "Then a short list called \"Fact checks\" only if needed.",
        "",
        "Text to rewrite:",
        input.trim()
      ].join("\n")
  }
};

export const freeButtons: TemplateKey[] = ["free_button1", "paid_button2"];
export const paidButtons: TemplateKey[] = [
  "free_button2",
  "free_button3",
  "paid_button1",
  "paid_button3",
  "paid_button4"
];

export function getModalConfig(key: TemplateKey) {
  return modalConfigs[key];
}

export function buildModalInput(key: TemplateKey, answers: ModalAnswers) {
  if (key === "paid_button1") {
    const parts = [
      "Application question:",
      answers.prompt.trim(),
      "",
      "Resume/context:",
      answers.context.trim() || "(none provided)"
    ];
    return parts.join("\n");
  }
  if (key === "free_button2") {
    const parts = [
      answers.prompt.trim(),
      "",
      "ADDITIONAL CONTEXT: What is distracting the user or making it hard for them to start?",
      answers.context.trim() || "(none provided)"
    ];
    return parts.join("\n");
  }
  if (key === "free_button3") {
    const parts = [
      "Complex topic or question:",
      answers.prompt.trim(),
      "",
      "Learner context:",
      answers.context.trim() || "(none provided)"
    ];
    return parts.join("\n");
  }
  const parts = [
    "Prompt:",
    answers.prompt.trim(),
    "",
    "Additional context:",
    answers.context.trim() || "(none provided)"
  ];
  if (modalConfigs[key].includeResume) {
    parts.push("", "Resume:", "(Upload or paste after this prompt.)");
  }
  return parts.join("\n");
}

export function buildPrompt(key: TemplateKey, input: string) {
  return templates[key].build(input);
}

export function getLabel(key: TemplateKey) {
  return templates[key].label;
}

export function getDescription(key: TemplateKey) {
  return templates[key].description;
}
