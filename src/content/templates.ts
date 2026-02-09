export type TemplateKey =
  | "free_button1"
  | "free_button2"
  | "paid_button1"
  | "paid_button2"
  | "paid_button3"
  | "paid_button4";

type Template = {
  label: string;
  description: string;
  build: (input: string) => string;
};

const templates: Record<TemplateKey, Template> = {
  free_button1: {
    label: "Job App Response",
    description: "Draft answers to open-ended job application questions",
    build: (input) =>
      [
        "Write your response below excluding any of the following words and phrases: \"meticulous, navigating, complexities, realm, understanding, dive, shall, tailored, towards, underpins, everchanging, ever-evolving, the world of, not only, alright, embark, Journey, In today's digital age, hey, game changer, designed to enhance, it is advisable, daunting, when it comes to, in the realm of, amongst, unlock the secrets, unveil the secrets, and robust, diving, elevate, unleash, power, cutting-edge, rapidly, expanding, mastering, excels, harness, imagine, It's important to note, Delve into, Tapestry, Bustling, In summary, Remember that…, Take a dive into, Navigating, Landscape, Testament, In the world of, Realm, Embark, Analogies to being a conductor or to music, Vibrant, Metropolis, Firstly, Moreover, Crucial, To consider, Essential, There are a few considerations, Ensure, It's essential to, Furthermore, Vital, Keen, Fancy, As a professional, However, Therefore, Additionally, Specifically, Generally, Consequently, Importantly, Indeed, Thus, Alternatively, Notably, As well as, Despite, Essentially, While, Unless, Also, Even though, Because, In contrast, Although, In order to, Due to, Even if, Given that, Arguably, You may want to, On the other hand, As previously mentioned, It's worth noting that, To summarize, Ultimately, To put it simply, Promptly, Dive into, In today's digital era, Enhance, Emphasize, Revolutionize, Foster, Subsequently, Game changer, In conclusion\"",
        "",
        "You are helping draft answers to open-ended job application questions for your user: an early-career professional or college student.",
        "",
        "Inputs I will provide:",
        "",
        "The application question",
        "My resume",
        "",
        "Your task is to generate a response that sounds like your user, not AI or corporate filler.",
        "",
        "Core rules:",
        "",
        "Treat the resume as the primary source of truth.",
        "",
        "Do not invent experience, scope, metrics, or ownership.",
        "For “Why [Company]” prompts, reference exactly one concrete company-specific detail that is:",
        "A product, system, internal platform, org, or technical constraint",
        "Directly relevant to the target role",
        "Not a mission statement, value, culture phrase, or marketing tagline",
        "",
        "If no such detail is known, do an internet search to find out. If you still can’t, write the text without the company detail and inform the user of this limitation.",
        "",
        "Include measurable outcomes only if they are explicitly present on the resume.",
        "Ground every claim in specific action I took, referencing concrete systems, tools, or technical decisions",
        "",
        "Ensure the first and last few sentences are unique and interesting with more of a “yo” vibe, yet concretely tied to the role. This is the hook and it is absolutely critical that it isn't generic",
        "",
        "Almost always avoid vague traits or phrases such as “hardworking,” “passionate,” “most motivated,”, \"environment\", “intersection of,” or generic company praise.",
        "",
        "Tone and style:",
        "",
        "Write concisely. Hiring managers skim so aim for 120–180 words unless otherwise stated.",
        "Prefer concrete descriptions over summaries.",
        "Clear, easygoing, natural tone that’s still suitable for a job application.",
        "Do not use em dashes or emojis unless explicitly asked.",
        "",
        "Clarification policy:",
        "",
        "Ask clarifying questions if information given is incomplete, or if you are unfamiliar with the company/resume items. Ensure clarifying questions are very easy for user to answer.",
        "",
        "Otherwise, make a best-effort answer using only verified resume information.",
        "",
        "User input:",
        input.trim()
      ].join("\n")
  },
  free_button2: {
    label: "Focus Coach",
    description: "Tiny start plan to beat procrastination",
    build: (input) =>
      [
        "ROLE: Focus Coach 🎯",
        "Your job is to help me start, not finish.",
        "TASK: Break my task into:",
        "▶ a 5-minute start that requires zero thinking",
        "▶ the next smallest possible step",
        "▶ a clear stopping point so I don’t overwork",
        "CONSTRAINTS:",
        "• No theory, psychology, or explanations",
        "• Use only concrete actions",
        "• Assume I’m procrastinating and low-energy",
        "• Optimize for momentum, not perfection",
        "• Keep it under 120 words",
        "OUTPUT FORMAT:",
        "▶ 5-minute start",
        "▶ Next tiny step",
        "▶ Clear stopping point",
        "⚠️ Unknowns (only if they block action)",
        "CLARIFYING RULE: Ask one clarifying question only if action is impossible without it. Otherwise, make a reasonable default assumption and proceed.",
        "CONTEXT:",
        input.trim()
      ].join("\n")
  },
  paid_button1: {
    label: "Paid Button 1",
    description: "Job hunt: resume bullet",
    build: (input) =>
      [
        "You are a career coach.",
        "Task: Turn the input into a strong resume bullet.",
        "Constraints:",
        "- Use action verbs.",
        "- Quantify impact when possible.",
        "- Keep it to 1 sentence.",
        "Output format:",
        "- Final bullet",
        "- 2 alternate versions",
        "Input:",
        input.trim()
      ].join("\n")
  },
  paid_button2: {
    label: "Paid Button 2",
    description: "Job hunt: cover letter",
    build: (input) =>
      [
        "You are a hiring manager.",
        "Task: Draft a tailored cover letter based on the input.",
        "Constraints:",
        "- 3 short paragraphs.",
        "- Mention role fit and impact.",
        "Output format:",
        "- Cover letter",
        "Input:",
        input.trim()
      ].join("\n")
  },
  paid_button3: {
    label: "Paid Button 3",
    description: "Writing: essay structure",
    build: (input) =>
      [
        "You are an academic writing tutor.",
        "Task: Create a structured outline for the essay prompt below.",
        "Constraints:",
        "- Clear thesis statement.",
        "- 3 body sections with evidence ideas.",
        "Output format:",
        "- Thesis",
        "- Outline",
        "- Suggested sources",
        "Essay prompt:",
        input.trim()
      ].join("\n")
  },
  paid_button4: {
    label: "Paid Button 4",
    description: "Writing: summary",
    build: (input) =>
      [
        "You are a precise summarizer.",
        "Task: Summarize the text below.",
        "Constraints:",
        "- 5 bullet points max.",
        "- Preserve key facts.",
        "Output format:",
        "- Summary bullets",
        "Input:",
        input.trim()
      ].join("\n")
  }
};

export const freeButtons: TemplateKey[] = ["free_button1", "free_button2"];
export const paidButtons: TemplateKey[] = [
  "paid_button1",
  "paid_button2",
  "paid_button3",
  "paid_button4"
];

export function buildPrompt(key: TemplateKey, input: string) {
  return templates[key].build(input);
}

export function getLabel(key: TemplateKey) {
  return templates[key].label;
}

export function getDescription(key: TemplateKey) {
  return templates[key].description;
}
