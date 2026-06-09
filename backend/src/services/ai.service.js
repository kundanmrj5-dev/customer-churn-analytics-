import { scoreFitnessProfile } from "./ml.service.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const configuredModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEFAULT_MODEL = configuredModel === "gpt-5.4-mini" ? "gpt-4.1-mini" : configuredModel;

function extractText(responseJson) {
  if (responseJson.output_text) return responseJson.output_text;

  return (responseJson.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("\n")
    .trim();
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function callOpenAi(prompt, fallback) {
  if (!process.env.OPENAI_API_KEY) {
    return { ...fallback, aiProvider: "local-fallback" };
  }

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: prompt,
        text: { format: { type: "json_object" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = extractText(data);
    const parsed = parseJsonText(text);
    return { ...(parsed || fallback), aiProvider: "openai", model: DEFAULT_MODEL };
  } catch (error) {
    console.error(error);
    return {
      ...fallback,
      aiProvider: "openai-error-local-fallback",
      model: DEFAULT_MODEL,
      aiError: error.message
    };
  }
}

export async function generateAssessment(profile = {}) {
  const ml = scoreFitnessProfile(profile);
  const fallback = {
    readinessScore: ml.readinessScore,
    injuryRisk: ml.injuryRisk,
    intensity: ml.intensity,
    workoutPlan: {
      split: ml.intensity === "recovery-focused" ? "3 strength, 2 cardio, 2 recovery" : "4 strength, 2 cardio, 1 recovery",
      sessionMinutes: ml.intensity === "progressive" ? [45, 55] : [30, 45],
      equipment: profile.equipment || profile.equipmentAccess || ["dumbbells", "bands", "mat"],
      focus: ["strength", "cardio", "mobility"]
    },
    nutritionPlan: {
      calories: ml.intensity === "progressive" ? 2260 : 2180,
      proteinGrams: Math.round((profile.weightKg || 82) * 1.7),
      carbsGrams: ml.intensity === "progressive" ? 205 : 180,
      fatGrams: 62,
      hydrationLiters: 3
    },
    safetyNotes: ["Warm up for 8 minutes", "Keep pain-free range of motion", "Stop if dizziness or sharp pain occurs"]
  };

  const prompt = `
You are FitAI, a careful fitness and nutrition coach. Return only valid JSON.
Create a personalized assessment using this user profile and ML score.

User profile:
${JSON.stringify(profile, null, 2)}

ML score:
${JSON.stringify(ml, null, 2)}

JSON shape:
{
  "readinessScore": number,
  "injuryRisk": number,
  "intensity": string,
  "workoutPlan": {
    "split": string,
    "sessionMinutes": [number, number],
    "equipment": string[],
    "focus": string[],
    "weeklySchedule": string[]
  },
  "nutritionPlan": {
    "calories": number,
    "proteinGrams": number,
    "carbsGrams": number,
    "fatGrams": number,
    "hydrationLiters": number,
    "mealIdeas": string[]
  },
  "safetyNotes": string[]
}
`;

  const ai = await callOpenAi(prompt, fallback);
  return { ...ai, ml };
}

export async function generateCoachReply({ message, profile = {}, context = {} }) {
  const ml = scoreFitnessProfile(profile);
  const fallback = {
    reply: `Based on your readiness score of ${ml.readinessScore}, keep this ${ml.intensity}. For "${message}", choose controlled movements, stay hydrated, and avoid painful ranges.`,
    actions: ["adjust_workout", "suggest_meal", "set_reminder"],
    recommendation: {
      workout: ml.intensity === "recovery-focused" ? "Mobility and low-impact cardio" : "Strength plus short cardio finisher",
      nutrition: "Prioritize protein at each meal and place most carbs near training."
    }
  };

  const prompt = `
You are FitAI, an AI fitness coach. Return only valid JSON.
Give concise, safe, personalized coaching. Do not diagnose medical conditions.

User message:
${message}

User profile:
${JSON.stringify(profile, null, 2)}

ML score:
${JSON.stringify(ml, null, 2)}

Extra context:
${JSON.stringify(context, null, 2)}

JSON shape:
{
  "reply": string,
  "actions": string[],
  "recommendation": {
    "workout": string,
    "nutrition": string
  }
}
`;

  const ai = await callOpenAi(prompt, fallback);
  return { ...ai, ml };
}
