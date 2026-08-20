/**
 * Offline rule-based health & recovery advisor.
 *
 * Matches a member's described discomfort against common gym complaints and
 * returns a recovery protocol, safe stretches, hydration/nutrition tips and a
 * YouTube search query for guided routines.
 */

export type HealthAdvice = {
  title: string;
  summary: string;
  recovery: string[];
  stretches: string[];
  hydration: string[];
  videoQuery: string;
  /** true when the symptom warrants seeing a doctor promptly */
  seeDoctor: boolean;
};

export const HEALTH_DISCLAIMER =
  "This is general fitness guidance, not medical advice. Stop any movement that causes sharp pain, and consult a doctor or physiotherapist for persistent, severe or worsening symptoms.";

type Rule = { keys: RegExp; advice: Omit<HealthAdvice, "seeDoctor"> & { seeDoctor?: boolean } };

const RULES: Rule[] = [
  {
    keys: /knee|lunge|squat pain|patell/i,
    advice: {
      title: "Knee discomfort",
      summary: "Usually load or tracking related — reduce depth and range before reducing training.",
      recovery: [
        "Swap lunges/deep squats for box squats or leg press in a pain-free range for 5–7 days",
        "Ice 10–15 min after training if there is swelling",
        "Strengthen glutes and VMO: glute bridges 3×15, terminal knee extensions 3×15",
      ],
      stretches: ["Quad stretch 2×30s per side", "Hip flexor couch stretch 2×30s", "Calf wall stretch 2×30s"],
      hydration: ["3–3.5 L water daily", "Protein 1.6–2 g/kg to support tissue repair", "Add haldi doodh (turmeric milk) at night"],
      videoQuery: "Knee pain during squats and lunges fix physiotherapy exercises",
    },
  },
  {
    keys: /lower back|low back|lumbar|deadlift pain|kamar/i,
    advice: {
      title: "Lower back tightness",
      summary: "Most often tight hips plus bracing fatigue. Keep moving; avoid loaded spinal flexion.",
      recovery: [
        "Skip deadlifts and bent-over rows for 3–5 days; use chest-supported variations",
        "Walk 15–20 min daily to keep the area circulating",
        "Dead bug 3×10 and bird dog 3×10 each side to rebuild bracing",
      ],
      stretches: ["Child's pose 3×30s", "Cat-cow 10 slow reps", "Piriformis / figure-4 stretch 2×30s per side"],
      hydration: ["3 L+ water", "Magnesium-rich foods: banana, spinach, almonds", "Warm compress 15 min before bed"],
      videoQuery: "Lower back tightness relief stretches routine",
    },
  },
  {
    keys: /shoulder|rotator|bench press pain|press pain/i,
    advice: {
      title: "Shoulder discomfort",
      summary: "Common with heavy pressing and poor scapular control.",
      recovery: [
        "Drop flat barbell bench for neutral-grip dumbbell press at 50–60% load",
        "Band pull-aparts 3×20 and face pulls 3×15 daily",
        "Keep elbows ~45° from the torso when pressing",
      ],
      stretches: ["Doorway pec stretch 2×30s", "Sleeper stretch 2×30s", "Thread-the-needle 2×30s per side"],
      hydration: ["3 L water", "Omega-3 sources: flaxseed, walnuts, fish", "Sleep 7–8 h — rotator cuff repairs overnight"],
      videoQuery: "Shoulder pain during bench press rotator cuff rehab exercises",
    },
  },
  {
    keys: /sore|doms|soreness|leg day|body pain|thakan/i,
    advice: {
      title: "Muscle soreness (DOMS)",
      summary: "Normal 24–72 h after new or heavy work. Active recovery beats full rest.",
      recovery: [
        "Light 15–20 min walk or cycling at easy pace",
        "Foam roll quads, hamstrings and calves 60s each",
        "Train the sore muscle again only at 50–60% load until soreness fades",
      ],
      stretches: ["Hamstring stretch 2×30s", "Standing quad stretch 2×30s", "Downward dog 3×20s"],
      hydration: ["3–4 L water — dehydration worsens soreness", "25–30 g protein within 2 h of training", "Dahi, dal, eggs or paneer at the next meal"],
      videoQuery: "Best active recovery routine for muscle soreness after leg day",
    },
  },
  {
    keys: /cramp|dehydrat|dizzy|light.?head/i,
    advice: {
      title: "Cramps / light-headedness",
      summary: "Typically fluid and electrolyte loss, especially in Indian summer training.",
      recovery: [
        "Stop the set, sit down and sip fluids slowly",
        "Take ORS, nimbu-pani with a pinch of salt, or coconut water post-workout",
        "Do not train fasted for more than 60 min",
      ],
      stretches: ["Gentle stretch of the cramping muscle 30–60s", "Calf raises 2×15 slow", "Ankle circles 10 each way"],
      hydration: ["500 ml water 2 h before training + 500–700 ml during", "Add potassium: banana, coconut water", "Avoid excess caffeine on hot days"],
      videoQuery: "How to prevent muscle cramps and dehydration while working out",
      seeDoctor: true,
    },
  },
  {
    keys: /chest pain|breath|palpit|faint|numb/i,
    advice: {
      title: "Warning symptom",
      summary: "Chest pain, breathlessness, fainting or numbness are not training soreness.",
      recovery: ["Stop exercising immediately", "Inform your trainer and a family member", "Seek medical review before your next session"],
      stretches: ["No stretching until cleared by a doctor"],
      hydration: ["Sip water, sit upright, rest in a cool area"],
      videoQuery: "When chest pain during exercise is an emergency",
      seeDoctor: true,
    },
  },
  {
    keys: /wrist|elbow|tennis|forearm/i,
    advice: {
      title: "Wrist / elbow strain",
      summary: "Grip-heavy and pressing volume usually drive this.",
      recovery: [
        "Use straps for pulls and wrist wraps for presses for 2 weeks",
        "Eccentric wrist curls 3×15 with a light dumbbell",
        "Reduce direct arm work volume by half",
      ],
      stretches: ["Wrist flexor stretch 2×30s", "Wrist extensor stretch 2×30s", "Forearm massage 60s per side"],
      hydration: ["3 L water", "Protein at every meal", "Ice 10 min after training if it throbs"],
      videoQuery: "Wrist and elbow pain lifting rehab exercises",
    },
  },
];

const GENERIC: HealthAdvice = {
  title: "General recovery protocol",
  summary: "No specific match found, so here is a safe baseline recovery plan.",
  recovery: [
    "Reduce training load by 30–40% for the next 3 sessions",
    "Prioritise 7–8 h sleep — most repair happens overnight",
    "Take one full rest day and reassess the symptom",
  ],
  stretches: ["Full-body mobility flow 10 min", "Cat-cow 10 reps", "Hip and hamstring stretch 2×30s each"],
  hydration: ["3–3.5 L water daily", "1.6–2 g/kg protein", "Add dahi, dal, eggs or paneer for repair nutrients"],
  videoQuery: "Full body recovery and mobility routine for gym members",
  seeDoctor: false,
};

/** Match a free-text complaint to a recovery protocol. */
export function getHealthAdvice(input: string): HealthAdvice {
  const text = input.trim();
  if (!text) return GENERIC;
  const hit = RULES.find((r) => r.keys.test(text));
  if (!hit) return GENERIC;
  return { seeDoctor: false, ...hit.advice };
}
