const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const title = document.querySelector("#view-title");
const API_BASE_URL = localStorage.getItem("fitaiApiBaseUrl") || "https://fitai-backend-jge7.onrender.com";
const WORKOUT_PLAN_VERSION = 2;

const demoProfile = {
  age: 29,
  gender: "male",
  heightCm: 178,
  weightKg: 82,
  goal: "fat_loss_muscle_tone",
  activityLevel: "moderate",
  dietPreference: "high_protein_vegetarian",
  healthConsiderations: ["lower_back_tightness"],
  equipmentAccess: ["dumbbells", "bands", "treadmill", "mat"],
  availableMinutes: 42,
  sleepHours: 7,
  soreness: 3
};

async function getDemoToken() {
  const stored = localStorage.getItem("fitaiAccessToken");
  if (stored) return stored;

  return createDemoToken();
}

async function createDemoToken() {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@fitai.local", name: "FitAI Demo User" })
  });

  if (!response.ok) throw new Error("Unable to create demo session");
  const data = await response.json();
  localStorage.setItem("fitaiAccessToken", data.accessToken);
  return data.accessToken;
}

async function apiFetch(path, options = {}, retry = true) {
  const token = await getDemoToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401 && retry) {
    localStorage.removeItem("fitaiAccessToken");
    await createDemoToken();
    return apiFetch(path, options, false);
  }

  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

function showView(id) {
  views.forEach((view) => {
    view.classList.toggle("active", view.id === id);
  });

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === id);
  });

  const activeView = document.getElementById(id);
  title.textContent = activeView?.dataset.title || "Dashboard";
}

navItems.forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.view));
});

const planButton = document.querySelector("#regenerate-plan");
const readinessScore = document.querySelector(".score-ring strong");
const insightList = document.querySelector(".insight-list");
const profileForm = document.querySelector(".profile-form");

function numberFromInput(value, fallback) {
  const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getAssessmentProfile() {
  if (!profileForm) return demoProfile;

  const data = new FormData(profileForm);
  const healthText = String(data.get("healthConsiderations") || "").trim();

  return {
    ...demoProfile,
    age: numberFromInput(data.get("age"), demoProfile.age),
    gender: String(data.get("gender") || demoProfile.gender),
    heightCm: numberFromInput(data.get("heightCm"), demoProfile.heightCm),
    weightKg: numberFromInput(data.get("weightKg"), demoProfile.weightKg),
    goal: String(data.get("goal") || demoProfile.goal),
    activityLevel: String(data.get("activityLevel") || demoProfile.activityLevel),
    dietPreference: String(data.get("dietPreference") || demoProfile.dietPreference),
    healthConsiderations: healthText ? [healthText] : []
  };
}

const workoutCatalog = {
  beginner: [
    {
      id: "strength-foundation",
      category: "strength",
      title: "Full Body Foundation",
      minutes: 32,
      equipment: "Home/Gym",
      exercises: [
        { name: "Goblet Squat", sets: 3, reps: "10", cue: "Keep chest tall and use a pain-free depth." },
        { name: "Incline Push-up", sets: 3, reps: "8-12", cue: "Brace your core and keep elbows controlled." },
        { name: "One-arm Dumbbell Row", sets: 3, reps: "10/side", cue: "Pause briefly when the dumbbell reaches your ribs." },
        { name: "Glute Bridge", sets: 3, reps: "12", cue: "Squeeze glutes without arching your lower back." }
      ]
    },
    {
      id: "cardio-base",
      category: "cardio",
      title: "Low-impact Cardio Base",
      minutes: 25,
      equipment: "No equipment",
      exercises: [
        { name: "Brisk Walk", sets: 1, reps: "8 min", cue: "Use a pace where conversation is still possible." },
        { name: "Step Touch", sets: 3, reps: "60 sec", cue: "Stay light and keep knees soft." },
        { name: "March in Place", sets: 3, reps: "60 sec", cue: "Drive arms and maintain a steady rhythm." },
        { name: "Recovery Walk", sets: 1, reps: "5 min", cue: "Slow breathing gradually before stopping." }
      ]
    },
    {
      id: "mobility-reset",
      category: "yoga",
      title: "Mobility Reset",
      minutes: 18,
      equipment: "Mat",
      exercises: [
        { name: "Cat-cow", sets: 2, reps: "8", cue: "Move slowly through a comfortable range." },
        { name: "Hip Flexor Stretch", sets: 2, reps: "30 sec/side", cue: "Keep ribs down and squeeze the rear glute." },
        { name: "Bird Dog", sets: 3, reps: "8/side", cue: "Keep hips level and move with control." },
        { name: "Child's Pose Breathing", sets: 1, reps: "2 min", cue: "Use slow nasal breaths." }
      ]
    }
  ],
  intermediate: [
    {
      id: "hypertrophy-builder",
      category: "strength",
      title: "Muscle Builder",
      minutes: 45,
      equipment: "Dumbbells/Gym",
      exercises: [
        { name: "Dumbbell Front Squat", sets: 4, reps: "8-10", cue: "Control the lowering phase for three seconds." },
        { name: "Dumbbell Bench Press", sets: 4, reps: "8-12", cue: "Keep shoulder blades gently pulled back." },
        { name: "Romanian Deadlift", sets: 4, reps: "10", cue: "Push hips back while keeping the spine neutral." },
        { name: "Dumbbell Row", sets: 4, reps: "10/side", cue: "Avoid rotating your torso." },
        { name: "Plank", sets: 3, reps: "40 sec", cue: "Brace as if preparing for a gentle punch." }
      ]
    },
    {
      id: "conditioning-circuit",
      category: "cardio",
      title: "Conditioning Circuit",
      minutes: 34,
      equipment: "Bodyweight",
      exercises: [
        { name: "Fast March", sets: 4, reps: "60 sec", cue: "Keep a sustainable pace." },
        { name: "Reverse Lunge", sets: 4, reps: "10/side", cue: "Step back far enough to keep the front heel down." },
        { name: "Mountain Climber", sets: 4, reps: "30 sec", cue: "Keep shoulders stacked over hands." },
        { name: "Shadow Boxing", sets: 4, reps: "60 sec", cue: "Rotate smoothly through the hips." }
      ]
    },
    {
      id: "recovery-flow",
      category: "yoga",
      title: "Recovery Flow",
      minutes: 24,
      equipment: "Mat",
      exercises: [
        { name: "World's Greatest Stretch", sets: 2, reps: "5/side", cue: "Move slowly and breathe out into the rotation." },
        { name: "90/90 Hip Switch", sets: 3, reps: "8", cue: "Stay tall and control each transition." },
        { name: "Dead Bug", sets: 3, reps: "10/side", cue: "Keep the lower back gently pressed down." },
        { name: "Box Breathing", sets: 1, reps: "4 min", cue: "Use equal inhale, hold, exhale, and hold counts." }
      ]
    }
  ],
  advanced: [
    {
      id: "advanced-strength",
      category: "strength",
      title: "Advanced Strength",
      minutes: 58,
      equipment: "Full Gym",
      exercises: [
        { name: "Back Squat", sets: 5, reps: "5", cue: "Maintain full-body tension and repeatable depth." },
        { name: "Bench Press", sets: 5, reps: "5", cue: "Drive feet into the floor and control each rep." },
        { name: "Weighted Pull-up", sets: 4, reps: "6-8", cue: "Lead with the chest and avoid swinging." },
        { name: "Romanian Deadlift", sets: 4, reps: "8", cue: "Keep the bar close and load the hamstrings." },
        { name: "Farmer Carry", sets: 4, reps: "40 m", cue: "Walk tall with controlled steps." }
      ]
    },
    {
      id: "performance-intervals",
      category: "cardio",
      title: "Performance Intervals",
      minutes: 40,
      equipment: "Bike/Treadmill",
      exercises: [
        { name: "Warm-up", sets: 1, reps: "8 min", cue: "Increase intensity gradually." },
        { name: "Hard Interval", sets: 8, reps: "60 sec", cue: "Use a challenging but repeatable effort." },
        { name: "Easy Recovery", sets: 8, reps: "90 sec", cue: "Recover enough to maintain interval quality." },
        { name: "Cool-down", sets: 1, reps: "6 min", cue: "Reduce pace gradually." }
      ]
    },
    {
      id: "athletic-mobility",
      category: "yoga",
      title: "Athletic Mobility",
      minutes: 28,
      equipment: "Mat/Band",
      exercises: [
        { name: "Cossack Squat", sets: 3, reps: "8/side", cue: "Keep the working foot flat." },
        { name: "Band Shoulder Dislocate", sets: 3, reps: "12", cue: "Use a wide, pain-free grip." },
        { name: "Single-leg Glute Bridge", sets: 3, reps: "10/side", cue: "Keep hips level." },
        { name: "Thoracic Rotation", sets: 3, reps: "8/side", cue: "Rotate through the upper back." }
      ]
    }
  ]
};

let selectedWorkoutLevel = localStorage.getItem("fitaiWorkoutLevel") || "beginner";
let selectedWorkoutId = localStorage.getItem("fitaiSelectedWorkout") || null;
let workoutTimerId = null;

function personalizeWorkout(workout, profile) {
  const goal = String(profile.goal || "").toLowerCase();
  const health = (profile.healthConsiderations || []).join(" ").toLowerCase();
  const personalized = structuredClone(workout);
  personalized.exercises = [
    { name: "Dynamic Warm-up", sets: 1, reps: "5 min", cue: "Raise body temperature gradually and use pain-free movement." },
    ...personalized.exercises,
    { name: "Cool-down Breathing", sets: 1, reps: "3 min", cue: "Slow your breathing and let your heart rate settle." }
  ];

  if (goal.includes("muscle") && personalized.category === "strength") {
    personalized.title = `${personalized.title} - Muscle Gain`;
    personalized.exercises = personalized.exercises.map((exercise) => ({
      ...exercise,
      sets: Math.min(Number(exercise.sets) + 1, 6)
    }));
  }

  if (goal.includes("fat") && personalized.category === "cardio") {
    personalized.title = `${personalized.title} - Fat Loss`;
    personalized.minutes += 5;
  }

  if (health.includes("knee")) {
    personalized.exercises = personalized.exercises.map((exercise) =>
      exercise.name.toLowerCase().includes("lunge")
        ? { name: "Supported Step-up", sets: exercise.sets, reps: exercise.reps, cue: "Use a low step and hold support." }
        : exercise
    );
  }

  if (health.includes("back")) {
    personalized.exercises = personalized.exercises.map((exercise) =>
      exercise.name.toLowerCase().includes("deadlift")
        ? { name: "Hip Hinge Drill", sets: exercise.sets, reps: exercise.reps, cue: "Use a light load and stop before discomfort." }
        : exercise
    );
  }

  personalized.summary = `${profile.goal || "General fitness"} plan for ${profile.activityLevel || selectedWorkoutLevel}.`;
  personalized.calories = Math.round(personalized.minutes * (selectedWorkoutLevel === "advanced" ? 9 : selectedWorkoutLevel === "intermediate" ? 7 : 5));
  return personalized;
}

function getWorkoutPlan() {
  const saved = JSON.parse(localStorage.getItem("fitaiWorkoutPlan") || "null");
  if (saved?.version === WORKOUT_PLAN_VERSION && saved?.level === selectedWorkoutLevel && saved?.workouts?.length) return saved;

  const profile = getAssessmentProfile();
  const plan = {
    version: WORKOUT_PLAN_VERSION,
    level: selectedWorkoutLevel,
    profile,
    generatedAt: new Date().toISOString(),
    workouts: workoutCatalog[selectedWorkoutLevel].map((workout) => personalizeWorkout(workout, profile))
  };
  localStorage.setItem("fitaiWorkoutPlan", JSON.stringify(plan));
  return plan;
}

function generateWorkoutPlan(profile, assessment = {}) {
  const activity = String(profile.activityLevel || "").toLowerCase();
  selectedWorkoutLevel = activity.includes("advanced") ? "advanced" : activity.includes("moderate") ? "intermediate" : "beginner";
  localStorage.setItem("fitaiWorkoutLevel", selectedWorkoutLevel);
  const plan = {
    version: WORKOUT_PLAN_VERSION,
    level: selectedWorkoutLevel,
    profile,
    readinessScore: assessment.readinessScore,
    injuryRisk: assessment.injuryRisk,
    generatedAt: new Date().toISOString(),
    workouts: workoutCatalog[selectedWorkoutLevel].map((workout) => personalizeWorkout(workout, profile))
  };
  localStorage.setItem("fitaiWorkoutPlan", JSON.stringify(plan));
  selectedWorkoutId = plan.workouts[0].id;
  localStorage.setItem("fitaiSelectedWorkout", selectedWorkoutId);
  renderWorkoutManagement();
}

function getSelectedWorkout() {
  const plan = getWorkoutPlan();
  return plan.workouts.find((workout) => workout.id === selectedWorkoutId) || plan.workouts[0];
}

function renderWorkoutManagement() {
  const plan = getWorkoutPlan();
  const grid = document.querySelector("#workout-grid");
  const table = document.querySelector("#exercise-table");
  const levelButtons = document.querySelectorAll("#workout-level-control button");
  if (!grid || !table) return;

  levelButtons.forEach((button) => button.classList.toggle("active", button.dataset.level === selectedWorkoutLevel));
  if (!selectedWorkoutId || !plan.workouts.some((workout) => workout.id === selectedWorkoutId)) {
    selectedWorkoutId = plan.workouts[0].id;
  }

  grid.innerHTML = plan.workouts.map((workout) => `
    <article class="workout-card selectable ${workout.id === selectedWorkoutId ? "selected" : ""}" data-workout-id="${workout.id}">
      <div class="workout-media ${workout.category}"></div>
      <div>
        <span class="pill">${workout.category === "yoga" ? "Mobility" : workout.category}</span>
        <h3>${workout.title}</h3>
        <p>${workout.summary}</p>
        <div class="workout-meta"><span>${workout.exercises.length} exercises</span><span>${workout.minutes} min</span><span>${workout.calories} kcal</span></div>
      </div>
    </article>
  `).join("");

  const selected = getSelectedWorkout();
  document.querySelector("#selected-workout-title").textContent = selected.title;
  document.querySelector("#selected-workout-summary").textContent = `${selected.minutes} minutes | ${selected.equipment} | approximately ${selected.calories} kcal`;
  table.innerHTML = `
    <div class="table-row head"><span>Exercise</span><span>Sets</span><span>Reps</span><span>Coach Cue</span></div>
    ${selected.exercises.map((exercise) => `<div class="table-row"><span>${exercise.name}</span><span>${exercise.sets}</span><span>${exercise.reps}</span><span>${exercise.cue}</span></div>`).join("")}
  `;

  grid.querySelectorAll(".workout-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedWorkoutId = card.dataset.workoutId;
      localStorage.setItem("fitaiSelectedWorkout", selectedWorkoutId);
      renderWorkoutManagement();
    });
  });
}

function getWorkoutSession() {
  return JSON.parse(localStorage.getItem("fitaiActiveWorkout") || "null");
}

function saveWorkoutSession(session) {
  localStorage.setItem("fitaiActiveWorkout", JSON.stringify(session));
}

function sessionElapsedSeconds(session) {
  const liveSeconds = session.running ? Math.floor((Date.now() - session.lastStartedAt) / 1000) : 0;
  return session.elapsedSeconds + liveSeconds;
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateSessionDisplay() {
  const session = getWorkoutSession();
  const panel = document.querySelector("#live-session-panel");
  if (!session || !panel) return;

  panel.hidden = false;
  document.querySelector("#session-workout-title").textContent = session.title;
  document.querySelector("#session-timer").textContent = formatDuration(sessionElapsedSeconds(session));
  const completed = session.exercises.filter((exercise) => exercise.completed).length;
  const percent = Math.round((completed / session.exercises.length) * 100);
  document.querySelector("#session-progress-bar").value = percent;
  document.querySelector("#session-progress-text").textContent = `${percent}% complete`;
  document.querySelector("#pause-session").textContent = session.running ? "Pause" : "Resume";
  document.querySelector("#session-exercises").innerHTML = session.exercises.map((exercise, index) => `
    <label class="session-exercise ${exercise.completed ? "completed" : ""}">
      <input type="checkbox" data-exercise-index="${index}" ${exercise.completed ? "checked" : ""} />
      <span><strong>${exercise.name}</strong><small>${exercise.sets} sets x ${exercise.reps}</small></span>
      <em>${exercise.completed ? "Done" : "Pending"}</em>
    </label>
  `).join("");

  document.querySelectorAll("[data-exercise-index]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const current = getWorkoutSession();
      current.exercises[Number(checkbox.dataset.exerciseIndex)].completed = checkbox.checked;
      saveWorkoutSession(current);
      updateSessionDisplay();
    });
  });
}

function startWorkoutSession() {
  const workout = getSelectedWorkout();
  const session = {
    id: `session-${Date.now()}`,
    workoutId: workout.id,
    title: workout.title,
    calories: workout.calories,
    startedAt: new Date().toISOString(),
    lastStartedAt: Date.now(),
    elapsedSeconds: 0,
    running: true,
    exercises: workout.exercises.map((exercise) => ({ ...exercise, completed: false }))
  };
  saveWorkoutSession(session);
  updateSessionDisplay();
  startSessionTimer();
  document.querySelector("#live-session-panel").scrollIntoView({ behavior: "smooth" });
}

function startSessionTimer() {
  clearInterval(workoutTimerId);
  workoutTimerId = setInterval(updateSessionDisplay, 1000);
}

function toggleSessionPause() {
  const session = getWorkoutSession();
  if (!session) return;
  if (session.running) {
    session.elapsedSeconds = sessionElapsedSeconds(session);
    session.running = false;
  } else {
    session.lastStartedAt = Date.now();
    session.running = true;
  }
  saveWorkoutSession(session);
  updateSessionDisplay();
}

function finishWorkoutSession() {
  const session = getWorkoutSession();
  if (!session) return;
  const completedExercises = session.exercises.filter((exercise) => exercise.completed).length;
  const completionRate = Math.round((completedExercises / session.exercises.length) * 100);
  const history = JSON.parse(localStorage.getItem("fitaiWorkoutHistory") || "[]");
  history.push({
    ...session,
    elapsedSeconds: sessionElapsedSeconds(session),
    completionRate,
    caloriesBurned: Math.round(session.calories * completionRate / 100),
    completedAt: new Date().toISOString()
  });
  localStorage.setItem("fitaiWorkoutHistory", JSON.stringify(history));
  localStorage.removeItem("fitaiActiveWorkout");
  clearInterval(workoutTimerId);
  document.querySelector("#live-session-panel").hidden = true;
  updateProgressFromHistory();
}

function updateProgressFromHistory() {
  const history = JSON.parse(localStorage.getItem("fitaiWorkoutHistory") || "[]");
  const completion = history.length ? Math.round(history.reduce((sum, item) => sum + item.completionRate, 0) / history.length) : 0;
  const calories = history.reduce((sum, item) => sum + item.caloriesBurned, 0);
  document.querySelector("#progress-completion-rate").textContent = `${completion}%`;
  document.querySelector("#progress-calories-burned").textContent = calories.toLocaleString();
  setDailyTask("workout", history.length > 0, false);
}

const nutritionTargets = {
  calories: 2180,
  protein: 140,
  waterLiters: 3
};

const meals = [
  { id: "breakfast", name: "Breakfast", details: "Oats, banana, milk, peanut butter", calories: 520, protein: 28 },
  { id: "lunch", name: "Lunch", details: "Rice, dal, paneer/tofu, salad", calories: 680, protein: 42 },
  { id: "snack", name: "Snack", details: "Fruit, curd, nuts or protein shake", calories: 320, protein: 24 },
  { id: "dinner", name: "Dinner", details: "Roti, vegetables, dal, curd", calories: 610, protein: 38 }
];

function getNutritionState() {
  return JSON.parse(localStorage.getItem("fitaiNutritionState") || '{"completedMeals":[],"waterLiters":0}');
}

function saveNutritionState(state) {
  localStorage.setItem("fitaiNutritionState", JSON.stringify(state));
}

function renderNutritionTracker() {
  const mealList = document.querySelector("#meal-list");
  if (!mealList) return;

  const state = getNutritionState();
  const completedMeals = new Set(state.completedMeals || []);
  const totals = meals.reduce(
    (sum, meal) => {
      if (completedMeals.has(meal.id)) {
        sum.calories += meal.calories;
        sum.protein += meal.protein;
      }
      return sum;
    },
    { calories: 0, protein: 0 }
  );

  mealList.innerHTML = meals.map((meal) => `
    <label class="meal-check ${completedMeals.has(meal.id) ? "completed" : ""}">
      <input type="checkbox" data-meal-id="${meal.id}" ${completedMeals.has(meal.id) ? "checked" : ""} />
      <span>
        <strong>${meal.name}</strong>
        <em>${meal.details}</em>
        <small>${meal.calories} kcal | ${meal.protein} g protein</small>
      </span>
    </label>
  `).join("");

  const caloriePercent = Math.min(Math.round((totals.calories / nutritionTargets.calories) * 100), 100);
  const proteinPercent = Math.min(Math.round((totals.protein / nutritionTargets.protein) * 100), 100);
  const mealPercent = Math.round((completedMeals.size / meals.length) * 100);

  document.querySelector("#nutrition-calories").textContent = `${totals.calories} / ${nutritionTargets.calories}`;
  document.querySelector("#nutrition-protein").textContent = `${totals.protein} / ${nutritionTargets.protein}g`;
  document.querySelector("#nutrition-calories-progress").value = caloriePercent;
  document.querySelector("#nutrition-protein-progress").value = proteinPercent;
  document.querySelector("#nutrition-status-pill").textContent = `${mealPercent}% logged`;
  document.querySelector("#water-total").textContent = `${Number(state.waterLiters || 0).toFixed(2)} L / ${nutritionTargets.waterLiters.toFixed(1)} L`;
  document.querySelector("#progress-meals-logged").textContent = `${completedMeals.size}/${meals.length}`;

  setDailyTask("meals", completedMeals.size === meals.length, false);
  setDailyTask("water", Number(state.waterLiters || 0) >= nutritionTargets.waterLiters, false);

  mealList.querySelectorAll("[data-meal-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const current = getNutritionState();
      const currentMeals = new Set(current.completedMeals || []);
      if (checkbox.checked) currentMeals.add(checkbox.dataset.mealId);
      else currentMeals.delete(checkbox.dataset.mealId);
      current.completedMeals = [...currentMeals];
      saveNutritionState(current);
      renderNutritionTracker();
      renderDailyProgress();
    });
  });
}

function changeWater(amount) {
  const state = getNutritionState();
  state.waterLiters = Math.max(0, Math.min(5, Number(state.waterLiters || 0) + amount));
  saveNutritionState(state);
  renderNutritionTracker();
  renderDailyProgress();
}

function resetNutrition() {
  saveNutritionState({ completedMeals: [], waterLiters: 0 });
  renderNutritionTracker();
  renderDailyProgress();
}

function getDailyProgressState() {
  return JSON.parse(localStorage.getItem("fitaiDailyProgress") || "{}");
}

function saveDailyProgressState(state) {
  localStorage.setItem("fitaiDailyProgress", JSON.stringify(state));
}

function setDailyTask(task, value, render = true) {
  const state = getDailyProgressState();
  state[task] = value;
  saveDailyProgressState(state);
  if (render) renderDailyProgress();
}

function renderDailyProgress() {
  const checklist = document.querySelector("#daily-checklist");
  if (!checklist) return;

  const state = getDailyProgressState();
  checklist.querySelectorAll("[data-progress-task]").forEach((checkbox) => {
    checkbox.checked = Boolean(state[checkbox.dataset.progressTask]);
  });

  const total = checklist.querySelectorAll("[data-progress-task]").length;
  const done = Object.values(state).filter(Boolean).length;
  const percent = Math.round((Math.min(done, total) / total) * 100);
  document.querySelector("#daily-progress-pill").textContent = `${percent}% done`;
  document.querySelector("#daily-score").textContent = `${percent}%`;
}

const planVariants = [
  {
    score: 82,
    items: [
      "Training split: 4 strength days, 2 cardio days, 1 recovery day.",
      "Calories: 2,180 kcal with 140 g protein and moderate carbs.",
      "Equipment: dumbbells, resistance bands, treadmill, yoga mat.",
      "Session length: 38-45 minutes with 8-minute mobility block."
    ]
  },
  {
    score: 76,
    items: [
      "Training split: 3 strength days, 2 low-impact cardio days, 2 recovery days.",
      "Calories: 2,050 kcal with 132 g protein and higher fiber meals.",
      "Equipment: bodyweight, dumbbells, bands, incline bench.",
      "Session length: 30-36 minutes with longer warm-ups."
    ]
  },
  {
    score: 89,
    items: [
      "Training split: upper/lower strength, HIIT finisher, yoga recovery.",
      "Calories: 2,260 kcal with 148 g protein and workout-timed carbs.",
      "Equipment: full gym access with machine alternatives.",
      "Session length: 45-52 minutes with progressive overload."
    ]
  }
];

let planIndex = 0;

planButton?.addEventListener("click", async () => {
  planButton.textContent = "Thinking...";
  planButton.disabled = true;

  try {
    const assessmentProfile = getAssessmentProfile();
    const assessment = await apiFetch("/api/ai/assessment", {
      method: "POST",
      body: JSON.stringify(assessmentProfile)
    });

    readinessScore.textContent = assessment.readinessScore;
    generateWorkoutPlan(assessmentProfile, assessment);
    const items = [
      `Training split: ${assessment.workoutPlan?.split || "Personalized weekly training"}.`,
      `Calories: ${assessment.nutritionPlan?.calories || 2180} kcal with ${assessment.nutritionPlan?.proteinGrams || 140} g protein.`,
      `ML injury risk: ${assessment.injuryRisk || assessment.ml?.injuryRisk || 35}%.`,
      `Profile analyzed: age ${assessmentProfile.age}, ${assessmentProfile.heightCm} cm, ${assessmentProfile.weightKg} kg, goal ${assessmentProfile.goal}.`
    ];
    insightList.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  } catch {
    planIndex = (planIndex + 1) % planVariants.length;
    const next = planVariants[planIndex];
    readinessScore.textContent = next.score;
    insightList.innerHTML = next.items.map((item) => `<li>${item}</li>`).join("");
  } finally {
    planButton.textContent = "Regenerate";
    planButton.disabled = false;
  }
});

const chatForm = document.querySelector("#chat-form");
const chatMessage = document.querySelector("#chat-message");
const chatThread = document.querySelector("#chat-thread");

const coachReplies = [
  "I can do that. I'll keep the plan joint-friendly and prioritize controlled tempo over intensity.",
  "Here's the adjustment: add 20 g protein at breakfast and move most carbs around your workout window.",
  "Nice. Based on your streak, I'd keep today moderate so tomorrow's session stays high quality.",
  "For form correction, film the first set from a 45-degree front angle and I'll flag knee, hip, and spine position."
];

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatMessage.value.trim();
  if (!text) return;

  const userBubble = document.createElement("div");
  userBubble.className = "message user";
  userBubble.textContent = text;
  chatThread.appendChild(userBubble);

  chatMessage.value = "";

  const aiBubble = document.createElement("div");
  aiBubble.className = "message ai";
  aiBubble.textContent = "Checking your AI coach...";
  chatThread.appendChild(aiBubble);
  chatThread.scrollTop = chatThread.scrollHeight;

  apiFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: text, profile: demoProfile })
  })
    .then((data) => {
      aiBubble.textContent = data.reply || coachReplies[Math.floor(Math.random() * coachReplies.length)];
    })
    .catch(() => {
      aiBubble.textContent = coachReplies[Math.floor(Math.random() * coachReplies.length)];
    })
    .finally(() => {
      chatThread.scrollTop = chatThread.scrollHeight;
    });
});

document.querySelector(".coach-tools button:nth-child(3)")?.addEventListener("click", async () => {
  const aiBubble = document.createElement("div");
  aiBubble.className = "message ai";
  aiBubble.textContent = "Analyzing sample squat form...";
  chatThread.appendChild(aiBubble);

  try {
    const form = await apiFetch("/api/ml/form-check", {
      method: "POST",
      body: JSON.stringify({
        kneeAngle: 86,
        hipAngle: 72,
        spineTilt: 7,
        repTempoSeconds: 2.7
      })
    });

    aiBubble.textContent = `Form score ${form.formScore}/100. ${form.corrections.join(" ")}`;
  } catch {
    aiBubble.textContent = "Start the backend to run the ML form check. Demo mode is still available.";
  }
});

document.querySelectorAll("#workout-level-control button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedWorkoutLevel = button.dataset.level;
    localStorage.setItem("fitaiWorkoutLevel", selectedWorkoutLevel);
    localStorage.removeItem("fitaiWorkoutPlan");
    selectedWorkoutId = null;
    renderWorkoutManagement();
  });
});

document.querySelector("#start-selected-workout")?.addEventListener("click", startWorkoutSession);
document.querySelector("#pause-session")?.addEventListener("click", toggleSessionPause);
document.querySelector("#finish-session")?.addEventListener("click", finishWorkoutSession);
document.querySelector(".hero-actions .primary-action")?.addEventListener("click", () => {
  showView("workouts");
  startWorkoutSession();
});
document.querySelector("#water-plus")?.addEventListener("click", () => changeWater(0.25));
document.querySelector("#water-minus")?.addEventListener("click", () => changeWater(-0.25));
document.querySelector("#reset-nutrition")?.addEventListener("click", resetNutrition);
document.querySelectorAll("[data-progress-task]").forEach((checkbox) => {
  checkbox.addEventListener("change", () => setDailyTask(checkbox.dataset.progressTask, checkbox.checked));
});

renderWorkoutManagement();
renderNutritionTracker();
renderDailyProgress();
updateProgressFromHistory();
if (getWorkoutSession()) {
  updateSessionDisplay();
  startSessionTimer();
}
