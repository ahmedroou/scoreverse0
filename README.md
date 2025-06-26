# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Configuring AI Features (Gemini API)

To enable the AI-powered features in this application (like handicap and matchup suggestions), you need to provide a Google AI API key.

1.  **Get your API key:** Visit [Google AI Studio](https://aistudio.google.com/) and create a new API key.
2.  **Set the environment variable:** Open the `.env` file in the root of this project. You will see a line like this:
    ```
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE
    ```
3.  **Update the file:** Replace `YOUR_GOOGLE_AI_API_KEY_HERE` with the actual API key you copied from Google AI Studio.
4.  **Restart the application:** Stop and restart the development server for the changes to take effect.

### API Usage Example

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
