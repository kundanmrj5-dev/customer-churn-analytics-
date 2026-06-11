# FitAI - Your Personal AI Fitness Coach

FitAI is a runnable single-page prototype for an AI-powered fitness and wellness platform. It covers profile setup, AI assessment, dashboard goals, workout management, nutrition planning, progress analytics, AI chat, subscriptions, and admin operations.

Open `index.html` in a browser to use the frontend. Run the backend from `backend/` to enable AI and ML endpoints.

## Product Scope

- Secure authentication model: email/password, recovery, Google, Apple, JWT, RBAC.
- Profile setup: age, gender, height, weight, goals, activity level, diet preferences, health considerations.
- AI plan generation: workout plans, meal plans, readiness insights, coaching responses.
- Dashboard: calories, hydration, streaks, protein target, reminders, AI recommendations.
- Workouts: level-based plans, instructions, videos-ready metadata, sets, reps, durations.
- Coach: chat, voice guidance, camera form correction, reminders, injury prevention.
- Nutrition: calorie target, protein, carbohydrate, fat, hydration, meal swaps.
- Progress: weight, BMI, body fat, workout completion, achievements, streaks, health score.
- Subscriptions: Free, Monthly Premium, Quarterly Premium, Yearly Premium.
- Admin: user management, subscription tracking, revenue, content, AI usage, support.

## Suggested Production Architecture

- Frontend: Next.js or React, responsive routes for onboarding, dashboard, workouts, nutrition, progress, chat, profile, subscriptions, and admin.
- Backend: Node.js and Express.js REST APIs with validation, business logic, AI orchestration, and user management.
- Database: PostgreSQL tables for users, profiles, plans, progress records, subscriptions, AI interaction history, workouts, meals, and admin audit logs.
- AI: model-backed plan generation, conversational coaching, recommendations, health insights, and form-correction analysis pipeline.
- Cloud: AWS hosting, object storage for media, backups, monitoring, secrets management, CDN, and autoscaling.
- Notifications: Firebase Cloud Messaging for workouts, hydration, goals, subscription events.
- Payments: Stripe, Razorpay, or equivalent for checkout, invoices, webhooks, subscription state, and billing history.

## Security Notes

- Hash passwords with Argon2id or bcrypt.
- Use short-lived access tokens and refresh token rotation.
- Validate all API input and enforce role-based access control.
- Encrypt sensitive profile and health-related data at rest.
- Keep AI prompts and interaction history scoped to the authenticated user.
- Store payment details only through the payment provider.

## Run The Backend With AI/ML

The backend supports:

- OpenAI-powered fitness assessment and AI chat when `OPENAI_API_KEY` is configured.
- Local fallback responses when no API key is configured.
- ML-style readiness, injury-risk, and form-score inference using local scoring models.

```powershell
cd "C:\Users\Asus\OneDrive\Documents\AI FITNESS TRACKER\backend"
npm install
copy .env.example .env
npm run dev
```

Edit `backend/.env`:

```env
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Test:

```powershell
curl http://localhost:4000/health
```

Expected:

```json
{
  "ok": true,
  "service": "fitai-api",
  "ai": "openai-enabled",
  "ml": "enabled"
}
```

If `OPENAI_API_KEY` is missing, the backend still works in `local-fallback` mode.

## AI/ML Endpoints

- `POST /api/ai/assessment` generates personalized workout and nutrition plans.
- `POST /api/chat` answers fitness, nutrition, and wellness questions.
- `POST /api/ml/readiness` returns BMI, readiness score, injury risk, and intensity.
- `POST /api/ml/recommendations` returns workout, calorie burn, BMI, exercise, and diet recommendations.
- `POST /api/ml/form-check` scores sample exercise form metrics.

The deployed GitHub Pages site is static. For live AI in production, deploy the backend to Render, Railway, Fly.io, or AWS, then point the frontend to that backend URL.

## Machine Learning Stack

FitAI now includes a Python ML workflow in `ml/`:

- Scikit-learn: main practical ML stack for tabular fitness data.
- Regression model: predicts calories burned from age, weight, goal, activity level, and workout duration.
- Classification model: predicts BMI category from profile data.
- Recommendation model: recommends exercise category and diet plan from similar user profiles.
- Dataset: `ml/datasets/fitai_training_sample.csv`.
- Model training: `ml/train_models.py`.
- Prediction example: `ml/predict.py`.
- PyTorch demo: `ml/pytorch_readiness_demo.py`.
- TensorFlow demo: `ml/tensorflow_readiness_demo.py`.

Run:

```powershell
cd "C:\Users\Asus\OneDrive\Documents\AI FITNESS TRACKER\ml"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python train_models.py
python predict.py
```

Optional TensorFlow and PyTorch demos:

```powershell
pip install -r requirements-deep-learning.txt
python pytorch_readiness_demo.py
python tensorflow_readiness_demo.py
```

For production, train models from real anonymized user data, save the model artifacts, and serve predictions through the existing Node.js `/api/ml/recommendations` endpoint or a separate Python ML microservice.
