# Kayda Sathi

Kayda Sathi is an Expo React Native MVP that turns a plain-language problem into structured legal-information sections and an editable complaint/request draft.

> Development status: Gemini classification and the curated JSON knowledge base are connected. A backend-only Gemini key is required. Kayda Sathi provides legal information, not legal advice; review the knowledge files and their verification metadata before production use.

## Architecture

```text
Expo screens -> services/legal.js -> POST /api/legal/analyze
                                      |
                                      +-- aiService (Gemini structured classification)
                                      +-- legalKnowledgeService (curated root data/*.json)
                                      +-- complaintService (curated editable template)

Expo microphone -> services/speechService.js -> POST /api/speech/transcribe
                                                  |
                                                  +-- server-side Groq or OpenAI transcription
                                                  +-- text returns to the existing problem field

Expo app -> Firebase Authentication (email/password)
         -> Firestore users/{uid}/queries (per-user saved history)
```

The legal and speech APIs remain stateless. After a signed-in user receives guidance, the Expo app saves that problem and structured result to the user's protected Firestore history. No audio recording is stored in Firebase.

## Setup

Node.js 22.13 or newer is recommended.

```bash
npm install
copy .env.example .env
copy backend\.env.example backend\.env
```

Add the Gemini key to the project-root `.env` file (the same folder as `package.json`):

```dotenv
GEMINI_API_KEY=your_server_only_key
# Optional; defaults to the attached integration's stable model
GEMINI_MODEL=gemini-3.8-flash
```

Do not use an `EXPO_PUBLIC_` prefix. Expo never calls Gemini directly, and `.env` is ignored by Git.

Add the Firebase Web App values to `backend/.env`. The backend exposes only these public client identifiers to the Expo app through `/api/config/firebase`; it never exposes Gemini or speech-provider secrets. For compatibility, the start script also loads an existing `backend/.env.txt`, though `backend/.env` is preferred.

Before using authentication and history:

1. In Firebase Console, enable **Authentication → Sign-in method → Email/Password**.
2. Create a Cloud Firestore database.
3. Deploy the included `firestore.rules`, either from Firebase Console or with `npx firebase-tools deploy --only firestore:rules` after selecting the project.

The rules allow a signed-in user to access only `users/{theirUid}/queries/*` and deny every other Firestore path.

Start the backend in one terminal:

```bash
npm run backend
```

Start Expo in another:

```bash
npm start
```

`EXPO_PUBLIC_API_BASE_URL=http://localhost:3000` works for web and usually for an iOS simulator. Android emulators commonly use `http://10.0.2.2:3000`. A physical Expo Go device must use the computer's LAN IP, such as `http://192.168.1.20:3000`; the phone and computer must be on the same network.

## API

`POST /api/legal/analyze`

```json
{ "problem": "My landlord has not returned my security deposit." }
```

Gemini returns only a validated category, problem type, confidence, language, and explicitly stated entities. Rights, steps, documents, authorities, official references, and complaint templates come from the matching curated JSON file. The response shape remains classification, summary, rights, next steps, documents, authority, complaint draft, and source metadata.

## Voice input

Voice remains an alternative input for the existing text flow:

```text
Microphone -> temporary recording -> POST /api/speech/transcribe -> editable problem text
                                                           |
                                                           +-> POST /api/legal/analyze
```

The implementation is isolated in `services/speechService.js`. It owns microphone permission, recording, upload, timeout, cancellation, response validation, errors, and cleanup. A successful transcription is placed in the existing editable problem field. If that field already contains text, the transcription is appended with a space rather than silently replacing it.

### Expo Go and Android

Kayda Sathi uses the official `expo-audio` recorder (`~57.0.5`), which is included in Expo Go, plus `expo-file-system` for temporary-file cleanup. This provides a real app-controlled microphone on physical Android without a custom development build. Android requests `RECORD_AUDIO` only after the user taps **Describe by voice**.

Native speech-recognition libraries were not selected because they require custom native code. Instead, Expo records an `.m4a` file in the app cache and uploads it to the server-only transcription endpoint. Internet access is required.

### Speech provider configuration

The default provider is Groq Whisper because its OpenAI-compatible endpoint is fast, multilingual, and practical for a hackathon. OpenAI transcription is also supported. Put one provider key in the backend `.env`; never use an `EXPO_PUBLIC_` prefix:

```dotenv
# Option A: Groq (default)
SPEECH_PROVIDER=groq
GROQ_API_KEY=your_server_only_key
SPEECH_TRANSCRIPTION_MODEL=whisper-large-v3-turbo

# Option B: OpenAI
# SPEECH_PROVIDER=openai
# OPENAI_API_KEY=your_server_only_key
# SPEECH_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

Restart `npm run backend` after changing the key. Without a configured key the endpoint returns a useful `503` response; typed input and legal analysis continue to work.

`POST /api/speech/transcribe` accepts a raw supported audio body, limits it to 8 MB, forwards it with a 25-second provider timeout, and returns `{ "text": "..." }`. Provider credentials never reach the app.

### Privacy

- Expo saves each recording only in its cache directory.
- The app deletes that file after success, failure, timeout, or cancellation.
- The backend handles audio in memory and does not write it to disk or a database.
- Audio is sent to the configured Groq or OpenAI transcription service only for speech-to-text.
- Only the returned text enters `POST /api/legal/analyze`.
- The final typed/transcribed problem and structured guidance are saved to Firestore only after authentication, because query history is an enabled product feature.
- Firestore rules isolate history by Firebase user UID.
- Consult the chosen provider's privacy and retention terms before production use.

### Web

`expo-audio` can also record on web, but browsers require a secure origin for microphone access. Localhost is suitable for development. Android Expo Go is the primary supported demonstration target.

### Voice testing

1. Open **Describe your problem**.
2. Tap **Describe by voice**.
3. Allow microphone access, speak, and tap **Stop listening**.
4. Confirm the transcription appears in the editable text field.
5. Edit it if needed, then use the unchanged **Analyze problem** action.
6. Deny microphone permission once and verify typing remains available.
7. Test with the backend stopped or provider key removed and verify a useful error appears.

## Knowledge-base files

The repository-level `data/` folder is the source of truth. Category mapping is fixed and path-safe: `consumer.json`, `cyber_fraud.json`, `rental.json`, `salary.json`, and `government_grievance.json`. The loader localizes `en`, `hi`, or `hinglish`, adds matching scenario guidance, normalizes authorities and sources, and passes the selected curated complaint template to the draft service. Missing or malformed files produce a controlled error; the backend does not substitute fabricated legal information.

## Verification

```bash
npm run test:backend
npm run doctor
npx expo export --platform android
```

The backend test suite covers legal analysis plus speech success, empty audio, unsupported audio, malformed transcription, provider failure, and the audio size limit.
