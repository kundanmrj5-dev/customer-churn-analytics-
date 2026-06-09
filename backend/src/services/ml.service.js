function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function normalizeActivity(activityLevel = "moderate") {
  const level = String(activityLevel).toLowerCase();
  if (level.includes("advanced") || level.includes("very")) return 1;
  if (level.includes("moderate")) return 0.65;
  if (level.includes("beginner") || level.includes("light")) return 0.35;
  return 0.5;
}

function hasHealthFlag(profile, keywords) {
  const text = [
    ...(profile.healthConsiderations || []),
    profile.healthConsiderations,
    profile.notes
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return keywords.some((keyword) => text.includes(keyword));
}

export function scoreFitnessProfile(profile = {}) {
  const age = Number(profile.age || 29);
  const heightCm = Number(profile.heightCm || profile.height || 178);
  const weightKg = Number(profile.weightKg || profile.weight || 82);
  const availableMinutes = Number(profile.availableMinutes || profile.availableWorkoutTime || 40);
  const sleepHours = Number(profile.sleepHours || 7);
  const soreness = Number(profile.soreness || 3);
  const activity = normalizeActivity(profile.activityLevel);
  const bmi = calculateBmi(heightCm, weightKg);

  const bmiPenalty = bmi ? Math.abs(bmi - 23) * 0.045 : 0.15;
  const agePenalty = clamp((age - 35) * 0.012, 0, 0.35);
  const sleepBonus = clamp((sleepHours - 6.5) * 0.12, -0.18, 0.18);
  const timeBonus = clamp((availableMinutes - 25) * 0.01, -0.12, 0.2);
  const sorenessPenalty = clamp(soreness * 0.055, 0, 0.35);

  const readinessRaw = 0.9 + activity + sleepBonus + timeBonus - bmiPenalty - agePenalty - sorenessPenalty;
  const readinessScore = Math.round(sigmoid(readinessRaw) * 100);

  const backRisk = hasHealthFlag(profile, ["back", "spine", "slip disc"]) ? 0.22 : 0;
  const kneeRisk = hasHealthFlag(profile, ["knee", "acl", "joint"]) ? 0.18 : 0;
  const injuryRisk = Math.round(
    clamp(sigmoid(-1.25 + soreness * 0.2 + bmiPenalty + agePenalty + backRisk + kneeRisk) * 100, 5, 95)
  );

  const intensity =
    readinessScore >= 84 && injuryRisk < 40
      ? "progressive"
      : readinessScore >= 68
        ? "moderate"
        : "recovery-focused";

  return {
    bmi,
    readinessScore,
    injuryRisk,
    intensity,
    features: {
      age,
      heightCm,
      weightKg,
      availableMinutes,
      activity,
      sleepHours,
      soreness
    }
  };
}

export function analyzeFormMetrics(metrics = {}) {
  const kneeAngle = Number(metrics.kneeAngle || 82);
  const hipAngle = Number(metrics.hipAngle || 68);
  const spineTilt = Number(metrics.spineTilt || 9);
  const repTempoSeconds = Number(metrics.repTempoSeconds || 3);

  const kneeScore = clamp(100 - Math.abs(kneeAngle - 90) * 1.2, 0, 100);
  const hipScore = clamp(100 - Math.abs(hipAngle - 70) * 1.1, 0, 100);
  const spineScore = clamp(100 - spineTilt * 3.2, 0, 100);
  const tempoScore = clamp(100 - Math.abs(repTempoSeconds - 3) * 12, 0, 100);
  const formScore = Math.round(kneeScore * 0.3 + hipScore * 0.25 + spineScore * 0.3 + tempoScore * 0.15);

  const corrections = [];
  if (kneeScore < 78) corrections.push("Keep knees tracking in line with toes.");
  if (hipScore < 78) corrections.push("Sit hips back slightly more before driving up.");
  if (spineScore < 78) corrections.push("Brace core and keep spine neutral.");
  if (tempoScore < 78) corrections.push("Use a controlled three-second lowering phase.");

  return {
    formScore,
    riskLevel: formScore >= 85 ? "low" : formScore >= 70 ? "medium" : "high",
    corrections: corrections.length ? corrections : ["Good form. Keep the same pace and posture."],
    metrics: { kneeAngle, hipAngle, spineTilt, repTempoSeconds }
  };
}
