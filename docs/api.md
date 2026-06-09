# FitAI API Contract

Base URL: `/api`

## Authentication

- `POST /auth/signup` creates an account and returns a JWT access token.
- `POST /auth/login` authenticates email/password users.
- `POST /auth/password-recovery` queues a password reset flow.
- `POST /auth/social` accepts Google or Apple identity payloads.

## User And AI Plans

- `GET /profile` returns the authenticated user's setup data.
- `PUT /profile` updates age, gender, height, weight, goals, activity, diet, health notes, equipment, and time availability.
- `POST /ai/assessment` generates workout and nutrition plans from the user profile.
- `GET /dashboard` returns daily goals, reminders, calories, hydration, streak, and recommendations.

## Fitness, Nutrition, And Progress

- `GET /workouts` lists recommended workouts by level and category.
- `GET /nutrition/today` returns calorie target, macros, hydration, and meals.
- `GET /progress` returns weight, BMI, body fat, completion rate, calories, achievements, and streaks.
- `POST /chat` sends a fitness, nutrition, or wellness prompt to the AI assistant.

## Subscriptions, Payments, And Notifications

- `GET /subscriptions/plans` returns Free, Monthly, Quarterly, and Yearly Premium plans.
- `POST /payments/checkout` creates a Stripe/Razorpay checkout session.
- `POST /notifications/register` registers an FCM device token.

## Admin

- `GET /admin/metrics` returns users, subscription revenue, AI usage, uptime, and operational metrics.

Admin routes require a JWT with role `admin`.
