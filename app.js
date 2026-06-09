const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const title = document.querySelector("#view-title");
const API_BASE_URL = localStorage.getItem("fitaiApiBaseUrl") || "https://fitai-backend-jge7.onrender.com";

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
    const assessment = await apiFetch("/api/ai/assessment", {
      method: "POST",
      body: JSON.stringify(demoProfile)
    });

    readinessScore.textContent = assessment.readinessScore;
    const items = [
      `Training split: ${assessment.workoutPlan?.split || "Personalized weekly training"}.`,
      `Calories: ${assessment.nutritionPlan?.calories || 2180} kcal with ${assessment.nutritionPlan?.proteinGrams || 140} g protein.`,
      `ML injury risk: ${assessment.injuryRisk || assessment.ml?.injuryRisk || 35}%.`,
      `AI provider: ${assessment.aiProvider || "backend"}.`
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
