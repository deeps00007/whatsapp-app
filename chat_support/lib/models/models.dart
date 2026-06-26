class Conversation {
  final String id;
  final String? userId;
  final String userEmail;
  final String? userName;
  final String status;
  final String? assignedAgent;
  final String? subject;
  final String createdAt;
  final String updatedAt;

  Conversation({
    required this.id,
    this.userId,
    required this.userEmail,
    this.userName,
    required this.status,
    this.assignedAgent,
    this.subject,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] ?? '',
      userId: json['user_id'],
      userEmail: json['user_email'] ?? '',
      userName: json['user_name'],
      status: json['status'] ?? 'open',
      assignedAgent: json['assigned_agent'],
      subject: json['subject'],
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
    );
  }
}

class SupportMessage {
  final String id;
  final String conversationId;
  final String senderType;
  final String? senderName;
  final String content;
  final String createdAt;

  SupportMessage({
    required this.id,
    required this.conversationId,
    required this.senderType,
    this.senderName,
    required this.content,
    required this.createdAt,
  });

  factory SupportMessage.fromJson(Map<String, dynamic> json) {
    return SupportMessage(
      id: json['id'] ?? '',
      conversationId: json['conversation_id'] ?? '',
      senderType: json['sender_type'] ?? 'user',
      senderName: json['sender_name'],
      content: json['content'] ?? '',
      createdAt: json['created_at'] ?? '',
    );
  }

  bool get isAgent => senderType == 'agent';
  bool get isBot => senderType == 'bot';
  bool get isUser => senderType == 'user';
}

class Stats {
  final int total;
  final int open;
  final int agentAssigned;
  final int resolved;
  final int closed;
  final int totalMessages;

  Stats({
    required this.total,
    required this.open,
    required this.agentAssigned,
    required this.resolved,
    required this.closed,
    required this.totalMessages,
  });

  factory Stats.fromJson(Map<String, dynamic> json) {
    return Stats(
      total: json['total'] ?? 0,
      open: json['open'] ?? 0,
      agentAssigned: json['agent_assigned'] ?? 0,
      resolved: json['resolved'] ?? 0,
      closed: json['closed'] ?? 0,
      totalMessages: json['total_messages'] ?? 0,
    );
  }
}
