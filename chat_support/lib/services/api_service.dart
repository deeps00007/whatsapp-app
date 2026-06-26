import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'https://growbychat.app';
  late String _apiKey;
  late String _agentName;

  void configure({required String apiKey, required String agentName}) {
    _apiKey = apiKey;
    _agentName = agentName;
  }

  Map<String, String> get _headers => {
        'x-admin-api-key': _apiKey,
        'x-agent-name': _agentName,
        'Content-Type': 'application/json',
      };

  Future<Stats> getStats() async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/admin/support/stats'),
      headers: _headers,
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to load stats: ${res.statusCode}');
    }
    return Stats.fromJson(json.decode(res.body));
  }

  Future<List<Conversation>> getConversations({
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    final params = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    if (status != null) params['status'] = status;

    final res = await http.get(
      Uri.parse('$baseUrl/api/admin/support/conversations').replace(queryParameters: params),
      headers: _headers,
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to load conversations: ${res.statusCode}');
    }
    final data = json.decode(res.body);
    final list = data['conversations'] as List? ?? [];
    return list.map((j) => Conversation.fromJson(j)).toList();
  }

  Future<Map<String, dynamic>> getMessages(String conversationId,
      {String? after}) async {
    final params = <String, String>{};
    if (after != null) params['after'] = after;

    final uri = Uri.parse(
            '$baseUrl/api/admin/support/conversations/$conversationId/messages')
        .replace(queryParameters: params);

    final res = await http.get(uri, headers: _headers);
    if (res.statusCode != 200) {
      throw Exception('Failed to load messages: ${res.statusCode}');
    }
    final data = json.decode(res.body);
    final convo = Conversation.fromJson(data['conversation']);
    final msgs = (data['messages'] as List? ?? [])
        .map((j) => SupportMessage.fromJson(j))
        .toList();
    return {'conversation': convo, 'messages': msgs};
  }

  Future<SupportMessage> sendMessage(String conversationId, String content) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/admin/support/conversations/$conversationId/messages'),
      headers: _headers,
      body: json.encode({'content': content}),
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to send message: ${res.statusCode}');
    }
    return SupportMessage.fromJson(json.decode(res.body)['message']);
  }

  Future<Conversation> updateStatus(String conversationId, String status,
      {String? subject}) async {
    final body = <String, dynamic>{'status': status};
    if (subject != null) body['subject'] = subject;

    final res = await http.patch(
      Uri.parse('$baseUrl/api/admin/support/conversations/$conversationId'),
      headers: _headers,
      body: json.encode(body),
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to update status: ${res.statusCode}');
    }
    return Conversation.fromJson(json.decode(res.body)['conversation']);
  }

  Future<void> heartbeat(String conversationId) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/api/admin/support/conversations/$conversationId/heartbeat'),
        headers: _headers,
      );
    } catch (_) {}
  }

  Future<void> clearHeartbeat(String conversationId) async {
    try {
      await http.delete(
        Uri.parse('$baseUrl/api/admin/support/conversations/$conversationId/heartbeat'),
        headers: _headers,
      );
    } catch (_) {}
  }

  Future<bool> registerToken(String token, {String? deviceInfo}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/admin/support/register-token'),
      headers: _headers,
      body: json.encode({'token': token, 'device_info': deviceInfo}),
    );
    return res.statusCode == 200;
  }

  Future<bool> unregisterToken(String token) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/api/admin/support/register-token'),
      headers: _headers,
      body: json.encode({'token': token}),
    );
    return res.statusCode == 200;
  }

  Future<Map<String, dynamic>> getAdminUsers() async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/admin/users'),
      headers: _headers,
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to load users: ${res.statusCode}');
    }
    return json.decode(res.body);
  }

  Future<Map<String, dynamic>> getAdminUserDetails(String userId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/admin/users/$userId'),
      headers: _headers,
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to load user details: ${res.statusCode}');
    }
    return json.decode(res.body);
  }
}
