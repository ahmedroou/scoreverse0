# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---
## ACTION REQUIRED: How to Fix the "API Key Not Valid" or "Service Blocked" Error

The application's AI features are currently disabled because the necessary Google Cloud services are not yet configured for your project (`scoreverse-kgk6y`). This application automatically uses your project's main Firebase API key to connect to Google's AI services, so you do not need to manage API keys yourself.

**To fix this, you must complete and verify two steps in your Google Cloud project.**

### Step-by-Step Instructions

1.  **Enable the "Generative Language API":** The AI features require this specific API to be active.
    *   **[Click this link to go to the API page for project `scoreverse-kgk6y`](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=scoreverse-kgk6y)**
    *   If the page shows a blue **"ENABLE"** button, click it.

2.  **Link a Billing Account:** Many Google Cloud APIs, including the Gemini API, require a billing account to be linked to your project, even to use the free tier.
    *   **[Click this link to go to the Billing page for project `scoreverse-kgk6y`](https://console.cloud.google.com/billing/linkedaccount?project=scoreverse-kgk6y)**
    *   If the page says "This project has no billing account," you will need to link one.

**After completing these steps, please restart the application for the changes to take effect.** If the problem persists, please follow the verification steps below.

---

### How to Verify Your Setup

If you have completed the steps above and still see an error, please double-check the following settings. This is the most common source of issues.

#### 1. Verify the Project ID Matches

The application is configured for project ID **`scoreverse-kgk6y`**. Please ensure this is the same project you are viewing in the Google Cloud Console. The project ID should be visible in the URL of the links above and at the top of the Google Cloud page.

#### 2. Verify the API is Enabled

*   Go back to the **[API Page](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=scoreverse-kgk6y)**.
*   The button at the top should say **"MANAGE"** with a green checkmark.
*   If it says **"ENABLE"**, the API is not active. Please click it to enable the service.

#### 3. Verify Billing is Linked

*   Go back to the **[Billing Page](https://console.cloud.google.com/billing/linkedaccount?project=scoreverse-kgk6y)**.
*   The page should show a linked billing account, for example: "Billing account `My Billing Account (0X0X0X-0X0X0X-0X0X0X)` is linked to this project."
*   If it says **"This project has no billing account"**, you must link one.

#### 4. Verify the API Key has No Restrictions (Advanced)

This is less common, but worth checking.
*   **[Go to the Credentials Page for your project](https://console.cloud.google.com/apis/credentials?project=scoreverse-kgk6y)**.
*   Find the key named **"Browser key (auto created by Firebase)"**.
*   Click the pencil icon (Edit) to view its details.
*   Under **"API restrictions"**, ensure that **"Don't restrict key"** is selected, OR that **"Generative Language API"** is explicitly included in the list of allowed APIs. If it is restricted and the Generative Language API is not on the list, it will be blocked.

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
