# Grow by Chat — Support Admin App

## Setup Instructions

### 1. Add Firebase Config
1. Go to [Firebase Console](https://console.firebase.google.com) → project `chatt-5bab4`
2. Add Android app → package name: `com.growbychat.chat_support`
3. Download `google-services.json`
4. Place it at: `chat_support/android/app/google-services.json`

### 2. Add Firebase to Gradle
The `android/build.gradle` and `android/app/build.gradle` are already configured with Firebase plugins.

### 3. Run the app
```bash
cd chat_support
flutter run
```

### 4. Login
- Agent Name: Your name (e.g. "Deepanshu")
- API Key: `gbc_admin_8094c8c5c9f4ad6512cdb5687d49b5f1005ad50a2812dae3`

## Features
- Dashboard with live stats (auto-refreshes every 10s)
- Conversation list with status filters
- Real-time chat (polls every 3s for new messages)
- Agent reply → user sees it instantly in their widget
- Push notifications via FCM when user sends a message
- Update conversation status (active/resolved/closed)

## API Endpoints Used
- `GET /api/admin/support/stats`
- `GET /api/admin/support/conversations`
- `GET /api/admin/support/conversations/{id}/messages`
- `POST /api/admin/support/conversations/{id}/messages`
- `PATCH /api/admin/support/conversations/{id}`
- `POST /api/admin/support/register-token`
- `DELETE /api/admin/support/register-token`
