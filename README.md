# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---
## ACTION REQUIRED: How to Fix the "API Key Not Valid" Error

The application's AI features are currently disabled because the required `GOOGLE_API_KEY` is missing. The editor for the `.env` file is "read-only" for security reasons.

**To fix this, you must create an API key in your Google Cloud project and ensure it is enabled.**

### Step-by-Step Instructions

1.  **Go to the Credentials Page for Your Project:**
    *   **[Click this direct link to open the Google Cloud Console for project `scoreverse-kgk6y`](https://console.cloud.google.com/apis/credentials?project=scoreverse-kgk6y)**

2.  **Create a New API Key:**
    *   At the top of the page, click **"+ CREATE CREDENTIALS"**.
    *   Select **"API key"** from the dropdown menu.
    *   A new key will be created and displayed in a popup window.

3.  **Copy Your New API Key:**
    *   Click the copy icon next to the key to copy it to your clipboard. **Do not share this key with anyone.**

4.  **No further action is needed in this editor.** By creating the key in your Google Cloud project, Firebase services associated with that project should automatically be able to use it. Please **restart the application** for the changes to take effect.

---
### Final Troubleshooting: Still Seeing the "API Key Invalid" Error?

If you have already created an API key using the link above and the error persists, there are a few common reasons this can happen. Please check the following:

1.  **Restart the Application:** Sometimes, changes in your Google Cloud project (like adding a new key) can take a moment to become active. A simple restart of the application can often resolve the issue.

2.  **Enable the "Generative Language API":** Creating a key is not enough; the specific API it needs to access must also be enabled for your project.
    *   **[Click this link to enable the API for project `scoreverse-kgk6y`](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=scoreverse-kgk6y)**
    *   If the page shows a blue **"ENABLE"** button, click it. If it says **"MANAGE"**, the API is already enabled, and you can move to the next step.

3.  **Link a Billing Account:** Many Google Cloud APIs, including the Gemini API, require a billing account to be linked to your project, even to use the free tier. This is to prevent abuse.
    *   **[Click here to check the billing status for project `scoreverse-kgk6y`](https://console.cloud.google.com/billing/linkedaccount?project=scoreverse-kgk6y)**
    *   If the page says "This project has no billing account," you will need to link one. Google provides a generous free tier, so you are unlikely to be charged for normal use of this application.

Completing these steps should resolve any remaining issues with the API key.

---

### API Usage Example (For Reference)

Here is an example of how to call the Gemini API using cURL. Remember to replace `GOOGLE_API_KEY` with your actual API key.

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=GOOGLE_API_KEY" \
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
