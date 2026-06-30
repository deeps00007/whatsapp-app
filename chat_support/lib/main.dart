import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:google_fonts/google_fonts.dart';
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

  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const initSettings = InitializationSettings(android: androidSettings);
  await _localNotifications.initialize(
    initSettings,
    onDidReceiveNotificationResponse: (NotificationResponse response) {
      final payload = response.payload;
      if (payload != null) {
        // Could navigate to specific conversation
      }
    },
  );

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
  await _localNotifications
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(const AndroidNotificationChannel(
        'support_messages',
        'Support Messages',
        description: 'New support messages from users',
        importance: Importance.high,
      ));

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

  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    final notification = message.notification;
    final data = message.data;
    final isUrgent = data['type'] == 'human_escalation';

    _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      notification?.title ??
          (isUrgent
              ? '🔔 URGENT: Human support requested'
              : 'New support message'),
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
          color: isUrgent ? const Color(0xFFFF5252) : const Color(0xFF6C63FF),
          enableVibration: true,
          fullScreenIntent: isUrgent,
        ),
      ),
      payload: data['conversation_id'],
    );
  });

  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    // Conversation will reload when dashboard refreshes
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
    final textTheme = GoogleFonts.interTextTheme();
    return MaterialApp(
      title: 'Grow by Chat Support',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6C63FF),
          primary: const Color(0xFF0A2540),
          secondary: const Color(0xFF6C63FF),
          surface: const Color(0xFFF0F2F8),
          onSurface: const Color(0xFF0A2540),
        ),
        textTheme: textTheme,
        primaryTextTheme: textTheme,
        scaffoldBackgroundColor: const Color(0xFFF0F2F8),
        appBarTheme: AppBarTheme(
          backgroundColor: const Color(0xFF0A2540),
          foregroundColor: Colors.white,
          elevation: 0,
          titleTextStyle: GoogleFonts.inter(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6C63FF),
            foregroundColor: Colors.white,
            elevation: 0,
            padding:
                const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            textStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF8F9FF),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: Color(0xFF6C63FF), width: 1.8),
          ),
          labelStyle: GoogleFonts.inter(
            fontSize: 14,
            color: Colors.grey.shade500,
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Colors.white,
          selectedItemColor: Color(0xFF6C63FF),
          unselectedItemColor: Colors.grey,
          elevation: 0,
        ),
        dividerTheme: DividerThemeData(
          color: Colors.grey.shade100,
          thickness: 1,
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      home: FutureBuilder<bool>(
        future: StorageService.isConfigured(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Scaffold(
              backgroundColor: const Color(0xFF0A2540),
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(Icons.support_agent_rounded,
                          color: Colors.white, size: 32),
                    ),
                    const SizedBox(height: 24),
                    const CircularProgressIndicator(
                        color: Color(0xFF6C63FF)),
                  ],
                ),
              ),
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
