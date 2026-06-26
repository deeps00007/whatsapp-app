import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

final ApiService apiService = ApiService();
final FlutterLocalNotificationsPlugin _localNotifications =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Initialize local notifications for foreground FCM display
  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const initSettings = InitializationSettings(android: androidSettings);
  await _localNotifications.initialize(
    initSettings,
    onDidReceiveNotificationResponse: (NotificationResponse response) {
      // Handle notification tap
      final payload = response.payload;
      if (payload != null) {
        // Could navigate to specific conversation
      }
    },
  );

  // Create notification channels
  await _createNotificationChannels();

  final config = await StorageService.getConfig();
  if (config['apiKey']!.isNotEmpty) {
    apiService.configure(
      apiKey: config['apiKey']!,
      agentName: config['agentName']!,
    );
    _initFCM();
  }

  runApp(const ChatSupportApp());
}

Future<void> _createNotificationChannels() async {
  // Normal support messages channel
  await _localNotifications
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(const AndroidNotificationChannel(
        'support_messages',
        'Support Messages',
        description: 'New support messages from users',
        importance: Importance.high,
      ));

  // Urgent escalation channel
  await _localNotifications
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(AndroidNotificationChannel(
        'urgent_escalation',
        'Urgent Escalations',
        description: 'Urgent: User requesting human support',
        importance: Importance.max,
        enableVibration: true,
        vibrationPattern: Int64List.fromList([0, 500, 250, 500, 250, 500]),
      ));
}

Future<void> _initFCM() async {
  final messaging = FirebaseMessaging.instance;

  await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );

  final token = await messaging.getToken();
  if (token != null) {
    await apiService.registerToken(token, deviceInfo: 'Android');
  }

  messaging.onTokenRefresh.listen((newToken) {
    apiService.registerToken(newToken, deviceInfo: 'Android');
  });

  FirebaseMessaging.onBackgroundMessage(_backgroundHandler);

  // Handle foreground notifications — THIS is what was missing
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;
    final isUrgent = data['type'] == 'human_escalation';

    // Show local notification even when app is in foreground
    _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      notification?.title ?? (isUrgent ? '🔔 URGENT: Human support requested' : 'New support message'),
      notification?.body ?? 'A user sent a new message',
      NotificationDetails(
        android: AndroidNotificationDetails(
          isUrgent ? 'urgent_escalation' : 'support_messages',
          isUrgent ? 'Urgent Escalations' : 'Support Messages',
          channelDescription: isUrgent
              ? 'Urgent: User requesting human support'
              : 'New support messages from users',
          importance: isUrgent ? Importance.max : Importance.high,
          priority: isUrgent ? Priority.max : Priority.high,
          icon: '@mipmap/ic_launcher',
          color: isUrgent ? const Color(0xFFFF0000) : const Color(0xFF25D366),
          enableVibration: true,
          fullScreenIntent: isUrgent,
        ),
      ),
      payload: data['conversation_id'],
    );
  });

  // Handle notification tap when app was in background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    final conversationId = message.data['conversation_id'];
    if (conversationId != null) {
      // The app will load the conversation when the dashboard refreshes
    }
  });
}

@pragma('vm:entry-point')
Future<void> _backgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class ChatSupportApp extends StatelessWidget {
  const ChatSupportApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Grow by Chat Support',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF075E54),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF25D366),
          primary: const Color(0xFF075E54),
        ),
        useMaterial3: true,
      ),
      home: FutureBuilder<bool>(
        future: StorageService.isConfigured(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator(color: Color(0xFF25D366))),
            );
          }
          if (snapshot.data!) {
            _initFCM();
            return DashboardScreen(api: apiService);
          }
          return LoginScreen(api: apiService);
        },
      ),
    );
  }
}
