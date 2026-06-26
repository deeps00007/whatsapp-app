import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _apiKeyKey = 'admin_api_key';
  static const _agentNameKey = 'agent_name';

  static Future<bool> isConfigured() async {
    final prefs = await SharedPreferences.getInstance();
    final key = prefs.getString(_apiKeyKey);
    return key != null && key.isNotEmpty;
  }

  static Future<void> saveConfig(String apiKey, String agentName) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_apiKeyKey, apiKey);
    await prefs.setString(_agentNameKey, agentName);
  }

  static Future<Map<String, String>> getConfig() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'apiKey': prefs.getString(_apiKeyKey) ?? '',
      'agentName': prefs.getString(_agentNameKey) ?? 'Support Agent',
    };
  }

  static Future<void> clearConfig() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_apiKeyKey);
    await prefs.remove(_agentNameKey);
  }
}
