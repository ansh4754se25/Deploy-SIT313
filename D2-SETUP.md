# D2 local setup

## Firebase Admin credentials

The Express server uses the Firebase Admin SDK to verify Firebase ID tokens and read/write Firestore. Create a Firebase service-account key from Firebase Console > Project settings > Service accounts. Keep the JSON key outside this repository and add its full path to the existing `cred.env` file as `GOOGLE_APPLICATION_CREDENTIALS`. Also set `FIREBASE_PROJECT_ID` to the same project ID. Do not commit `cred.env` or the service-account JSON.

`cred.env.example` shows the variable names. Add these settings to your existing `cred.env`; preserve the existing Mailgun key.

## Firestore security rules

Deploy `firestore.rules` to the same Firebase project before using the D2 flows. These rules keep profile plan changes on the backend and prevent browser clients from accessing the posts collection directly. The Express Admin SDK uses the service account and bypasses client security rules.

## Run the app

Open two terminals in the project folder. In the first, run `npm run dev` for the backend. In the second, run `npm --prefix frontend run dev` for the Vite frontend. The frontend defaults to `http://localhost:3000` for the API; set `VITE_API_BASE_URL` in the frontend environment if the backend uses another address.

The Paid upgrade is a class demonstration, not a real payment. The backend records the plan upgrade; the existing confirmation email still uses Mailgun settings in `cred.env`.
