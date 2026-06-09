const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const title = document.querySelector("#view-title");

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

planButton?.addEventListener("click", () => {
  planIndex = (planIndex + 1) % planVariants.length;
  const next = planVariants[planIndex];
  readinessScore.textContent = next.score;
  insightList.innerHTML = next.items.map((item) => `<li>${item}</li>`).join("");
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

  const aiBubble = document.createElement("div");
  aiBubble.className = "message ai";
  aiBubble.textContent = coachReplies[Math.floor(Math.random() * coachReplies.length)];
  chatThread.appendChild(aiBubble);

  chatMessage.value = "";
  chatThread.scrollTop = chatThread.scrollHeight;
});
