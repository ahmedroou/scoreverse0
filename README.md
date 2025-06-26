# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---
## ACTION REQUIRED: How to Fix the "API Key Not Valid" Error

The application's AI features are currently disabled because the necessary Google Cloud services are not yet configured for your project. This application automatically uses your project's main Firebase API key to connect to Google's AI services, so you do not need to manage API keys yourself.

**To fix this, you must complete two steps in your Google Cloud project.**

### Step-by-Step Instructions

1.  **Enable the "Generative Language API":** The AI features require this specific API to be active.
    *   **[Click this link to enable the API for project `scoreverse-kgk6y`](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=scoreverse-kgk6y)**
    *   If the page shows a blue **"ENABLE"** button, click it. If it says **"MANAGE"**, the API is already enabled, and you can move to the next step.

2.  **Link a Billing Account:** Many Google Cloud APIs, including the Gemini API, require a billing account to be linked to your project, even to use the free tier. This is a standard security measure.
    *   **[Click here to check the billing status for project `scoreverse-kgk6y`](https://console.cloud.google.com/billing/linkedaccount?project=scoreverse-kgk6y)**
    *   If the page says "This project has no billing account," you will need to link one. Google provides a generous free tier, so you are unlikely to be charged for normal use of this application.

**After completing these two steps, please restart the application for the changes to take effect.**

---

### API Usage Example (For Reference)

Here is an example of how to call the Gemini API using cURL. Remember to replace `YOUR_API_KEY` with an actual API key from your project if you want to test this outside the application.

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```
