function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function classifyBmi(bmi) {
  if (!bmi) return { category: "unknown", label: "Needs height and weight", risk: "unknown" };
  if (bmi < 18.5) return { category: "underweight", label: "Underweight", risk: "nutrition-focus" };
  if (bmi < 23) return { category: "healthy", label: "Healthy range", risk: "low" };
  if (bmi < 25) return { category: "at_risk", label: "At-risk range", risk: "moderate" };
  if (bmi < 30) return { category: "overweight", label: "Overweight range", risk: "moderate" };
  return { category: "obese", label: "Obesity range", risk: "high" };
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

function normalizeGoal(goal = "") {
  const value = String(goal).toLowerCase();
  if (value.includes("muscle")) return "muscle_gain";
  if (value.includes("strength")) return "strength";
  if (value.includes("cardio") || value.includes("endurance")) return "cardio_endurance";
  if (value.includes("yoga") || value.includes("mobility")) return "mobility";
  if (value.includes("fat") || value.includes("weight")) return "fat_loss";
  return "general_fitness";
}

function activityMultiplier(profile = {}) {
  const level = normalizeActivity(profile.activityLevel);
  if (level >= 0.95) return 1.725;
  if (level >= 0.6) return 1.55;
  if (level >= 0.35) return 1.375;
  return 1.2;
}

function estimateBmr(profile = {}) {
  const age = Number(profile.age || 29);
  const heightCm = Number(profile.heightCm || profile.height || 178);
  const weightKg = Number(profile.weightKg || profile.weight || 82);
  const gender = String(profile.gender || "").toLowerCase();
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (gender.includes("female") ? -161 : 5));
}

function estimateCalorieTargets(profile = {}) {
  const goal = normalizeGoal(profile.goal);
  const bmr = estimateBmr(profile);
  const maintenanceCalories = Math.round(bmr * activityMultiplier(profile));
  const calories =
    goal === "fat_loss"
      ? maintenanceCalories - 350
      : goal === "muscle_gain" || goal === "strength"
        ? maintenanceCalories + 250
        : maintenanceCalories;
  const weightKg = Number(profile.weightKg || profile.weight || 82);
  const proteinMultiplier = goal === "muscle_gain" || goal === "strength" ? 1.9 : goal === "fat_loss" ? 1.8 : 1.6;
  const proteinGrams = Math.round(weightKg * proteinMultiplier);
  const fatGrams = Math.round((calories * 0.25) / 9);
  const carbsGrams = Math.max(80, Math.round((calories - proteinGrams * 4 - fatGrams * 9) / 4));

  return {
    bmr,
    maintenanceCalories,
    targetCalories: clamp(calories, 1400, 4200),
    proteinGrams,
    carbsGrams,
    fatGrams,
    hydrationLiters: Number(clamp(weightKg * 0.035, 2.2, 4.2).toFixed(1))
  };
}

function estimateCalorieBurn(profile = {}, workout = {}) {
  const goal = normalizeGoal(profile.goal);
  const weightKg = Number(profile.weightKg || profile.weight || 82);
  const minutes = Number(workout.minutes || profile.availableMinutes || profile.availableWorkoutTime || 40);
  const intensity = workout.intensity || scoreFitnessProfile(profile).intensity;
  const category = String(workout.category || goal).toLowerCase();
  const baseMet =
    category.includes("strength") || goal === "strength" || goal === "muscle_gain"
      ? 5.8
      : category.includes("cardio") || goal === "cardio_endurance" || goal === "fat_loss"
        ? 7.2
        : 3.2;
  const intensityFactor = intensity === "progressive" ? 1.12 : intensity === "recovery-focused" ? 0.82 : 1;
  const predictedCalories = Math.round(((baseMet * 3.5 * weightKg) / 200) * minutes * intensityFactor);

  return {
    predictedCalories,
    minutes,
    method: "regression-style MET estimate",
    confidence: intensity === "recovery-focused" ? 0.72 : 0.84,
    features: { weightKg, baseMet, intensityFactor }
  };
}

function recommendExercises(profile = {}) {
  const goal = normalizeGoal(profile.goal);
  const healthBack = hasHealthFlag(profile, ["back", "spine", "slip disc"]);
  const healthKnee = hasHealthFlag(profile, ["knee", "acl", "joint"]);
  const ml = scoreFitnessProfile(profile);
  const level = ml.intensity === "progressive" ? "advanced" : ml.intensity === "moderate" ? "intermediate" : "beginner";

  const library = {
    fat_loss: [
      ["Incline Walk Intervals", "Cardio", "6 rounds", "Keep breathing controlled"],
      ["Goblet Squat", "Strength", "3 x 12", "Use smooth tempo"],
      ["Dumbbell Row", "Strength", "3 x 12", "Pause at the ribs"],
      ["Step-up", "Cardio strength", "3 x 10/side", "Use a low box if knees feel sensitive"],
      ["Plank", "Core", "3 x 35 sec", "Keep ribs down"]
    ],
    muscle_gain: [
      ["Dumbbell Bench Press", "Strength", "4 x 8-10", "Control the lowering phase"],
      ["Goblet Squat", "Strength", "4 x 10", "Progress load weekly"],
      ["Romanian Deadlift", "Strength", "4 x 8-10", "Hinge from hips"],
      ["One-arm Row", "Strength", "4 x 10/side", "Avoid torso rotation"],
      ["Lateral Raise", "Hypertrophy", "3 x 15", "Lead with elbows"]
    ],
    strength: [
      ["Squat Pattern", "Strength", "5 x 5", "Keep repeatable depth"],
      ["Bench Press or Push-up", "Strength", "5 x 5", "Brace before each rep"],
      ["Hip Hinge", "Strength", "4 x 6", "Keep spine neutral"],
      ["Row", "Strength", "4 x 8", "Pull shoulder blades back"],
      ["Loaded Carry", "Core", "4 x 30 m", "Walk tall"]
    ],
    cardio_endurance: [
      ["Zone 2 Walk/Jog", "Cardio", "25 min", "Stay conversational"],
      ["Bike Intervals", "Cardio", "8 rounds", "Repeatable hard efforts"],
      ["Step Touch", "Low impact", "4 x 60 sec", "Soft knees"],
      ["Dead Bug", "Core", "3 x 10/side", "Move slowly"],
      ["Cool-down Walk", "Recovery", "5 min", "Slow breathing"]
    ],
    mobility: [
      ["Cat-cow", "Mobility", "2 x 8", "Move slowly"],
      ["Hip Flexor Stretch", "Mobility", "2 x 40 sec/side", "Squeeze rear glute"],
      ["Bird Dog", "Core", "3 x 8/side", "Keep hips level"],
      ["90/90 Hip Switch", "Mobility", "3 x 8", "Stay tall"],
      ["Box Breathing", "Recovery", "4 min", "Use steady nasal breathing"]
    ],
    general_fitness: [
      ["Goblet Squat", "Strength", "3 x 10", "Pain-free depth"],
      ["Incline Push-up", "Strength", "3 x 10", "Keep core braced"],
      ["Dumbbell Row", "Strength", "3 x 12", "Pause at top"],
      ["Brisk Walk", "Cardio", "15 min", "Sustainable pace"],
      ["Hip Flexor Stretch", "Mobility", "2 x 30 sec", "Do not force range"]
    ]
  };

  let exercises = library[goal] || library.general_fitness;
  if (healthBack) {
    exercises = exercises.map((item) => item[0].includes("Romanian Deadlift") || item[0].includes("Hip Hinge")
      ? ["Glute Bridge", "Strength", item[2], "Load glutes without stressing the lower back"]
      : item);
  }
  if (healthKnee) {
    exercises = exercises.map((item) => item[0].includes("Squat") || item[0].includes("Step-up")
      ? ["Box Squat", item[1], item[2], "Use a controlled range and stop before knee pain"]
      : item);
  }

  return {
    level,
    goal,
    exercises: exercises.map(([name, category, prescription, cue]) => ({ name, category, prescription, cue }))
  };
}

function recommendWorkout(profile = {}) {
  const ml = scoreFitnessProfile(profile);
  const goal = normalizeGoal(profile.goal);
  const availableMinutes = Number(profile.availableMinutes || profile.availableWorkoutTime || 40);
  const level = ml.intensity === "progressive" ? "advanced" : ml.intensity === "moderate" ? "intermediate" : "beginner";
  const focus =
    goal === "muscle_gain" || goal === "strength"
      ? "strength and progressive overload"
      : goal === "fat_loss"
        ? "strength plus low-impact conditioning"
        : goal === "cardio_endurance"
          ? "aerobic base and intervals"
          : "mobility, core stability, and recovery";

  return {
    title: `${level[0].toUpperCase()}${level.slice(1)} ${focus} plan`,
    level,
    focus,
    weeklySplit: ml.intensity === "recovery-focused" ? "3 workout days, 2 mobility days, 2 rest days" : "4 workout days, 2 cardio/mobility days, 1 rest day",
    sessionMinutes: clamp(availableMinutes, 20, 75),
    safetyNote: ml.injuryRisk > 55 ? "Prioritize controlled range and avoid painful movements." : "Progress gradually when form is stable."
  };
}

function recommendDiet(profile = {}) {
  const targets = estimateCalorieTargets(profile);
  const diet = String(profile.dietPreference || "").toLowerCase();
  const vegetarian = diet.includes("vegetarian");
  const vegan = diet.includes("vegan");
  const proteinBase = vegan ? "tofu, tempeh, soy milk, lentils" : vegetarian ? "paneer, curd, dal, tofu, milk" : "eggs, chicken, fish, curd, dal";

  return {
    targetCalories: targets.targetCalories,
    macros: {
      proteinGrams: targets.proteinGrams,
      carbsGrams: targets.carbsGrams,
      fatGrams: targets.fatGrams
    },
    hydrationLiters: targets.hydrationLiters,
    recommendation: `Use ${proteinBase} across 3-4 meals and place most carbs near training.`,
    meals: [
      { name: "Breakfast", details: vegetarian || vegan ? "Oats with soy/curd, banana, nuts" : "Eggs or curd bowl with oats", calories: Math.round(targets.targetCalories * 0.24), protein: Math.round(targets.proteinGrams * 0.25) },
      { name: "Lunch", details: vegetarian || vegan ? "Rice/roti, dal, tofu/paneer, salad" : "Rice/roti, lean protein, dal, salad", calories: Math.round(targets.targetCalories * 0.32), protein: Math.round(targets.proteinGrams * 0.32) },
      { name: "Snack", details: vegetarian || vegan ? "Fruit plus protein shake or roasted chana" : "Fruit plus curd or protein shake", calories: Math.round(targets.targetCalories * 0.14), protein: Math.round(targets.proteinGrams * 0.18) },
      { name: "Dinner", details: vegetarian || vegan ? "Vegetables, dal, tofu/paneer, roti" : "Vegetables, lean protein, dal, roti", calories: Math.round(targets.targetCalories * 0.3), protein: Math.round(targets.proteinGrams * 0.25) }
    ]
  };
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

  const healthPenalty = hasHealthFlag(profile, ["pain", "injury", "back", "knee", "spine", "acl"]) ? 7 : 0;
  const ageAdjustment = age < 18 ? -3 : age <= 35 ? 4 : -Math.round(agePenalty * 18);
  const bmiAdjustment = bmi ? -Math.round(Math.abs(bmi - 23) * 1.8) : -4;
  const readinessScore = Math.round(
    clamp(
      58 +
        activity * 22 +
        sleepBonus * 45 +
        timeBonus * 35 -
        sorenessPenalty * 40 +
        ageAdjustment +
        bmiAdjustment -
        healthPenalty,
      30,
      96
    )
  );

  const backRisk = hasHealthFlag(profile, ["back", "spine", "slip disc"]) ? 0.22 : 0;
  const kneeRisk = hasHealthFlag(profile, ["knee", "acl", "joint"]) ? 0.18 : 0;
  const injuryRisk = Math.round(
    clamp(18 + soreness * 5 + bmiPenalty * 35 + agePenalty * 25 + backRisk * 100 + kneeRisk * 100, 5, 95)
  );

  const intensity =
    readinessScore >= 84 && injuryRisk < 40
      ? "progressive"
      : readinessScore >= 68
        ? "moderate"
        : "recovery-focused";

  return {
    bmi,
    bmiCategory: classifyBmi(bmi),
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

export function generateMlRecommendations(profile = {}) {
  const ml = scoreFitnessProfile(profile);
  const workoutRecommendation = recommendWorkout(profile);
  const exerciseRecommendation = recommendExercises(profile);
  const calorieBurnPrediction = estimateCalorieBurn(profile, {
    minutes: workoutRecommendation.sessionMinutes,
    category: exerciseRecommendation.goal,
    intensity: ml.intensity
  });
  const dietRecommendation = recommendDiet(profile);

  return {
    profileSummary: {
      age: Number(profile.age || 29),
      weightKg: Number(profile.weightKg || profile.weight || 82),
      heightCm: Number(profile.heightCm || profile.height || 178),
      goal: normalizeGoal(profile.goal)
    },
    readiness: ml,
    bmiPrediction: {
      bmi: ml.bmi,
      ...ml.bmiCategory
    },
    workoutRecommendation,
    calorieBurnPrediction,
    exerciseRecommendation,
    dietRecommendation
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
