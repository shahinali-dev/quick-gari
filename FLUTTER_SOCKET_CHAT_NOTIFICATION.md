# QuickGari — Flutter: Socket, Chat & Notification Integration Guide

This guide explains how to integrate Socket.IO real-time chat and Firebase push notifications (FCM) with the QuickGari backend. It includes socket events, payload shapes, REST endpoints, and minimal Flutter code examples for `socket_io_client` and `firebase_messaging`.

**Files referenced**

- Server socket config: [quick-gari/src/config/socket.config.ts](quick-gari/src/config/socket.config.ts#L1-L999)
- Chat service & routes: [quick-gari/src/modules/chat/chat.service.ts](quick-gari/src/modules/chat/chat.service.ts#L1-L999) and [quick-gari/src/modules/chat/chat.controller.ts](quick-gari/src/modules/chat/chat.controller.ts#L1-L999)
- Notification service & routes: [quick-gari/src/modules/notification/notification.service.ts](quick-gari/src/modules/notification/notification.service.ts#L1-L999) and [quick-gari/src/modules/notification/notification.controller.ts](quick-gari/src/modules/notification/notification.controller.ts#L1-L999)
- FCM util: [quick-gari/src/utils/fcm.utils.ts](quick-gari/src/utils/fcm.utils.ts#L1-L200)

---

## 1) Quick overview

- The backend uses Socket.IO for real-time messaging and rooms.
- On connect, clients must emit `user:connect` to join `user:USERID` and possible rooms (`room:admin`, `room:car-owners`).
- Notifications are also sent through Socket.IO (`notification:new`) and via FCM for offline devices.
- REST endpoints exist for sending/fetching messages and managing FCM tokens.

---

## 2) Important socket events (server ↔ client)

- `user:connect` (client → server)
  - Purpose: register socket with user and join rooms.
  - Payload: `{ userId: string, role: string, isCarOwner?: boolean }`

- `chat:typing` (client → server)
  - Sent when user starts typing.
  - Payload: `{ contextType: "ride"|"return"|"share_vehicle", contextId: string, senderId: string, receiverId: string }`
  - Server will forward to receiver: `chat:typing` with `{ contextType, contextId, senderId }`.

- `chat:stop_typing` (client → server)
  - Same payload as `chat:typing`. Server forwards to receiver as `chat:stop_typing`.

- `chat:read` (client → server)
  - Marks messages as read (bulk). Payload: `{ contextType, contextId, userId }`.

- `chat:message` (server → client)
  - New message notification for both sender and receiver (multi-device sync).
  - Payload example:
    ```json
    {
      "_id": "<messageId>",
      "contextType": "ride",
      "contextId": "<contextId>",
      "senderId": "<senderId>",
      "receiverId": "<receiverId>",
      "message": "Hello",
      "isRead": false,
      "createdAt": "2026-07-13T..."
    }
    ```

- `chat:closed` (server → client)
  - Sent when a conversation is closed (ride started). Payload: `{ contextType, contextId, message }`.

- `notification:new` (server → client)
  - Notification payload (socket):
    ```json
    {
      "_id": "<notificationId>",
      "type": "RIDE_REQUEST",
      "message": "New ride request...",
      "refs": { "rideId": "<rideId>" },
      "metadata": { ... },
      "timestamp": "2026-07-13T..."
    }
    ```
  - The server also sends FCM push messages with `data` fields: `{ type, notificationId, rideId?, carId?, paymentId? }` and notification title/body.

---

## 3) REST endpoints (useful from Flutter)

Base path: `/api/v1`

Chat

- POST `/api/v1/chat/conversation/:contextType/:contextId` — create conversation
  - body: `{ driverId }` (server uses authenticated user as the other participant)
- POST `/api/v1/chat/send` — send a message
  - body: `{ contextType, contextId, receiverId, message }`
- GET `/api/v1/chat/conversation/:contextType/:contextId?limit=50` — fetch messages
- PATCH `/api/v1/chat/read/:contextType/:contextId` — mark messages as read (authenticated user)
- GET `/api/v1/chat/unread-count?contextType=ride` — unread count

Notification

- GET `/api/v1/notification/` — get recent notifications
- GET `/api/v1/notification/unread-count` — unread count
- PATCH `/api/v1/notification/mark-as-read/:id` — mark single notification
- PATCH `/api/v1/notification/mark-all-as-read` — mark all
- PATCH `/api/v1/notification/settings/update/fcm-token` — save/update FCM token
  - body: `{ fcmToken: string }`
- DELETE `/api/v1/notification/settings/delete/fcm-token` — remove token
  - body: `{ fcmToken: string }`

Notes: All endpoints require authenticated requests (send Authorization header with Bearer token). See backend auth middleware.

---

## 4) Flutter: Socket.IO setup (minimal)

Recommended package: `socket_io_client`

Example (Dart):

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;

  void connect(String serverUrl, String userId, String role, {bool isCarOwner = false}) {
    socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .setExtraHeaders({ 'Authorization': 'Bearer <token>' })
        .build(),
    );

    socket.on('connect', (_) {
      print('connected: \\${socket.id}');
      // Register user on server
      socket.emit('user:connect', {
        'userId': userId,
        'role': role,
        'isCarOwner': isCarOwner,
      });
    });

    socket.on('chat:message', (data) {
      // data is the message payload (see guide above)
      print('new chat message: $data');
    });

    socket.on('chat:typing', (data) {
      // { contextType, contextId, senderId }
    });

    socket.on('notification:new', (data) {
      // show in-app notification or update UI
    });

    socket.on('disconnect', (_) => print('disconnected'));
  }

  void sendTyping(String contextType, String contextId, String senderId, String receiverId) {
    socket.emit('chat:typing', {
      'contextType': contextType,
      'contextId': contextId,
      'senderId': senderId,
      'receiverId': receiverId,
    });
  }

  void sendStopTyping(...) { /* similar to above */ }

  void sendRead(String contextType, String contextId, String userId) {
    socket.emit('chat:read', {
      'contextType': contextType,
      'contextId': contextId,
      'userId': userId,
    });
  }
}
```

Notes:

- Include `Authorization` header if your server requires it for socket handshake.
- Use `websocket` transport and enable auto-reconnect.

---

## 5) Flutter: Sending / Receiving messages (recommended flow)

- Sending a message: prefer REST POST `/api/v1/chat/send` (server persists) — backend will emit `chat:message` to both parties.
  - Benefits: atomic persistence before emit, retry-friendly.

Example HTTP (Dart using `http`):

```dart
final res = await http.post(Uri.parse('$baseUrl/api/v1/chat/send'),
  headers: { 'Authorization': 'Bearer $token', 'Content-Type': 'application/json' },
  body: jsonEncode({
    'contextType': 'ride',
    'contextId': '<contextId>',
    'receiverId': '<receiverId>',
    'message': 'Hello',
  }),
);
```

- Receiving: handle `chat:message` socket event and append to local list. For reliability, also fetch conversation history from GET `/api/v1/chat/conversation/:contextType/:contextId`.

---

## 6) FCM integration (minimal)

Recommended package: `firebase_messaging`

- On app start, request permission and obtain `fcmToken`.
- Send token to backend: PATCH `/api/v1/notification/settings/update/fcm-token` with `{ fcmToken }`.
- Handle messages:
  - Foreground: `onMessage` handler — show in-app banner.
  - Background / terminated: configure `onBackgroundMessage` to handle tap and navigation.

FCM data payload format (from backend):

- `data` contains keys: `type`, `notificationId`, optionally `rideId`, `carId`, `paymentId`.
- `notification` contains `title` and `body`.
- Android `clickAction` set to `FLUTTER_NOTIFICATION_CLICK` (good to route taps).

Sample Flutter snippet:

```dart
FirebaseMessaging messaging = FirebaseMessaging.instance;

// get token
String? token = await messaging.getToken();
if (token != null) {
  // send to backend
}

FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // show in-app
  print('Foreground message: ${message.data}');
});

FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  // user tapped notification - navigate
  final data = message.data;
  // e.g. if data['type'] == 'RIDE_REQUEST' navigate to ride screen
});
```

---

## 7) Rooms & server behavior (notes)

- After `user:connect`, the server joins the socket to `user:USERID`. Use this to target single users.
- Admins are joined to `room:admin`. Car-owners to `room:car-owners`.
- The backend uses `socketService.sendToUser(userId, event, data)` and `sendToAllAdmins`, `sendToCarOwners`.

---

## 8) Practical tips

- Use REST for sending messages (persistence), rely on socket only for real-time delivery.
- Use `message._id` for deduplication across devices.
- Call `socket.emit('chat:read', {...})` when the conversation screen becomes visible to mark messages read in real-time.
- Register FCM token after user logs in and update on token refresh.
- Handle reconnection gracefully (re-emit `user:connect` after reconnect).

---

## 9) Quick checklist for Flutter dev

- [ ] Add `socket_io_client` and `firebase_messaging` packages.
- [ ] Implement socket connect and emit `user:connect`.
- [ ] Listen for `chat:message`, `notification:new`, `chat:typing`.
- [ ] Use REST `/chat/send` to send messages.
- [ ] Register FCM token and call `/notification/settings/update/fcm-token`.
- [ ] Handle notification taps with `onMessageOpenedApp` to navigate.

---
