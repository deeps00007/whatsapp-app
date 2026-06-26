import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class ChatScreen extends StatefulWidget {
  final ApiService api;
  final Conversation conversation;

  const ChatScreen({
    super.key,
    required this.api,
    required this.conversation,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen>
    with TickerProviderStateMixin {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();
  List<SupportMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  Timer? _pollTimer;
  Timer? _heartbeatTimer;
  String? _lastTimestamp;
  bool _isTyping = false;

  // Brand palette
  static const Color _accent = Color(0xFF6C63FF);
  static const Color _agentBubble = Color(0xFFEEEDF9);
  static const Color _userBubble = Color(0xFF6C63FF);
  static const Color _botBubble = Color(0xFFF0F0F0);

  late AnimationController _typingAnim;

  @override
  void initState() {
    super.initState();
    _typingAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);

    _loadMessages();
    _pollTimer =
        Timer.periodic(const Duration(seconds: 3), (_) => _pollNewMessages());
    _heartbeatTimer =
        Timer.periodic(const Duration(seconds: 5), (_) {
      widget.api.heartbeat(widget.conversation.id);
    });
    widget.api.heartbeat(widget.conversation.id);

    _messageController.addListener(() {
      setState(() => _isTyping = _messageController.text.isNotEmpty);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _heartbeatTimer?.cancel();
    widget.api.clearHeartbeat(widget.conversation.id);
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _typingAnim.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    try {
      final result = await widget.api.getMessages(widget.conversation.id);
      final msgs = result['messages'] as List<SupportMessage>;
      final seen = <String>{};
      final unique = msgs.where((m) => seen.add(m.id)).toList();
      setState(() {
        _messages = unique;
        _loading = false;
        if (unique.isNotEmpty) _lastTimestamp = unique.last.createdAt;
      });
      _scrollToBottom();
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pollNewMessages() async {
    if (_lastTimestamp == null) return;
    try {
      final result = await widget.api.getMessages(
        widget.conversation.id,
        after: _lastTimestamp,
      );
      final allNewMsgs = result['messages'] as List<SupportMessage>;
      final existingIds = _messages.map((m) => m.id).toSet();
      final newMsgs =
          allNewMsgs.where((m) => !existingIds.contains(m.id)).toList();
      if (newMsgs.isNotEmpty && mounted) {
        setState(() {
          _messages.addAll(newMsgs);
          _lastTimestamp = newMsgs.last.createdAt;
        });
        _scrollToBottom();
      }
    } catch (_) {}
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _sending) return;

    HapticFeedback.lightImpact();
    setState(() => _sending = true);
    _messageController.clear();

    try {
      final msg = await widget.api.sendMessage(widget.conversation.id, content);
      setState(() {
        _messages.add(msg);
        _lastTimestamp = msg.createdAt;
        _sending = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        _showErrorSnack('Failed to send message');
        setState(() => _sending = false);
      }
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      await widget.api.updateStatus(widget.conversation.id, status);
      if (mounted) {
        _showSuccessSnack('Status updated to ${status.replaceAll('_', ' ')}');
      }
    } catch (e) {
      if (mounted) _showErrorSnack('Failed to update status');
    }
  }

  void _showErrorSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(msg),
        ],
      ),
      backgroundColor: Colors.red.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  void _showSuccessSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(msg),
        ],
      ),
      backgroundColor: const Color(0xFF27AE60),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  String _formatTime(String isoStr) {
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      final hour = dt.hour.toString().padLeft(2, '0');
      final min = dt.minute.toString().padLeft(2, '0');
      return '$hour:$min';
    } catch (_) {
      return '';
    }
  }

  bool _shouldShowDateDivider(int index) {
    if (index == 0) return true;
    final curr = DateTime.tryParse(_messages[index].createdAt)?.toLocal();
    final prev = DateTime.tryParse(_messages[index - 1].createdAt)?.toLocal();
    if (curr == null || prev == null) return false;
    return curr.day != prev.day ||
        curr.month != prev.month ||
        curr.year != prev.year;
  }

  String _formatDate(String isoStr) {
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      final now = DateTime.now();
      if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
        return 'Today';
      }
      final yesterday = now.subtract(const Duration(days: 1));
      if (dt.day == yesterday.day &&
          dt.month == yesterday.month &&
          dt.year == yesterday.year) {
        return 'Yesterday';
      }
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open':
        return const Color(0xFFFF7849);
      case 'agent_assigned':
        return const Color(0xFF4F83F1);
      case 'resolved':
        return const Color(0xFF27AE60);
      case 'closed':
        return const Color(0xFF9E9E9E);
      default:
        return const Color(0xFF9E9E9E);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name =
        widget.conversation.userName ?? widget.conversation.userEmail;
    final initials = name.length >= 2
        ? name.substring(0, 2).toUpperCase()
        : name[0].toUpperCase();
    final statusColor = _statusColor(widget.conversation.status);

    return Scaffold(
      backgroundColor: const Color(0xFFF2F3F8),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(72),
        child: _buildAppBar(name, initials, statusColor),
      ),
      body: Column(
        children: [
          Expanded(child: _buildMessageList()),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildAppBar(String name, String initials, Color statusColor) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A1F36), Color(0xFF2D3561)],
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 8, 8, 12),
          child: Row(
            children: [
              // Back button
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white70, size: 18),
                onPressed: () => Navigator.pop(context),
              ),
              // Avatar
              Stack(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [_accent, _accent.withOpacity(0.7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          )),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: const Color(0xFF1A1F36), width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              // Title
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 1),
                    Text(
                      widget.conversation.userEmail,
                      style: const TextStyle(
                          color: Colors.white54, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Actions
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded,
                    color: Colors.white70, size: 20),
                onSelected: _updateStatus,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 8,
                itemBuilder: (_) => [
                  _popupItem(
                      'agent_assigned', 'Mark Active', Icons.headset_mic),
                  _popupItem('resolved', 'Mark Resolved',
                      Icons.check_circle_rounded),
                  _popupItem(
                      'closed', 'Close Chat', Icons.cancel_rounded),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  PopupMenuItem<String> _popupItem(
      String value, String label, IconData icon) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade700),
          const SizedBox(width: 10),
          Text(label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    if (_loading) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: _accent),
            const SizedBox(height: 12),
            Text('Loading messages...',
                style: TextStyle(
                    color: Colors.grey.shade500, fontSize: 13)),
          ],
        ),
      );
    }

    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _accent.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.chat_bubble_outline_rounded,
                  size: 48, color: _accent.withOpacity(0.5)),
            ),
            const SizedBox(height: 16),
            Text('No messages yet',
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                )),
            const SizedBox(height: 4),
            Text('Start the conversation below',
                style: TextStyle(
                    color: Colors.grey.shade400, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        final isAgentOrBot = msg.isAgent || msg.isBot;
        final showDate = _shouldShowDateDivider(index);

        return Column(
          children: [
            if (showDate) _buildDateDivider(msg.createdAt),
            _buildMessageBubble(msg, isAgentOrBot, index),
          ],
        );
      },
    );
  }

  Widget _buildDateDivider(String isoStr) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              _formatDate(isoStr),
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(
      SupportMessage msg, bool isLeft, int index) {
    // Determine if we show avatar (first message or different sender)
    final showAvatar = isLeft &&
        (index == 0 || _messages[index - 1].senderType != msg.senderType);

    final bubbleColor = msg.isAgent
        ? _agentBubble
        : msg.isBot
            ? _botBubble
            : _userBubble;

    final textColor = msg.isUser ? Colors.white : const Color(0xFF1A1F36);
    final timeColor = msg.isUser
        ? Colors.white.withOpacity(0.6)
        : Colors.grey.shade400;

    return Padding(
      padding: EdgeInsets.only(
        bottom: 4,
        left: isLeft ? 0 : 48,
        right: isLeft ? 48 : 0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment:
            isLeft ? MainAxisAlignment.start : MainAxisAlignment.end,
        children: [
          // Left avatar
          if (isLeft) ...[
            if (showAvatar)
              _buildSenderAvatar(msg)
            else
              const SizedBox(width: 36),
            const SizedBox(width: 8),
          ],
          // Bubble
          Flexible(
            child: Column(
              crossAxisAlignment: isLeft
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.end,
              children: [
                // Sender label
                if (isLeft && showAvatar && msg.senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 3),
                    child: Text(
                      msg.senderName!,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: msg.isBot
                            ? Colors.grey.shade500
                            : const Color(0xFF6C63FF),
                      ),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: bubbleColor,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isLeft ? 4 : 18),
                      bottomRight: Radius.circular(isLeft ? 18 : 4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Bot icon indicator
                      if (msg.isBot)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.auto_awesome_rounded,
                                  size: 12,
                                  color: Colors.grey.shade500),
                              const SizedBox(width: 4),
                              Text('AI Assistant',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade500,
                                    fontWeight: FontWeight.w600,
                                  )),
                            ],
                          ),
                        ),
                      Text(
                        msg.content,
                        style: TextStyle(
                          fontSize: 14,
                          color: textColor,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _formatTime(msg.createdAt),
                            style: TextStyle(
                              fontSize: 10,
                              color: timeColor,
                            ),
                          ),
                          // Checkmarks for agent messages
                          if (!isLeft) ...[
                            const SizedBox(width: 4),
                            Icon(Icons.done_all_rounded,
                                size: 14,
                                color: Colors.white.withOpacity(0.7)),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSenderAvatar(SupportMessage msg) {
    if (msg.isBot) {
      return Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: const Icon(Icons.auto_awesome_rounded,
            size: 14, color: Colors.blueGrey),
      );
    }
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: const Color(0xFF27AE60),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.support_agent_rounded,
          size: 15, color: Colors.white),
    );
  }

  Widget _buildInputBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.07),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Attachment button
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {},
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Icon(Icons.attach_file_rounded,
                          color: Colors.grey.shade400, size: 22),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              // Text input
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF2F3F8),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: TextField(
                    controller: _messageController,
                    focusNode: _focusNode,
                    maxLines: null,
                    keyboardType: TextInputType.multiline,
                    textCapitalization: TextCapitalization.sentences,
                    style: const TextStyle(fontSize: 14, color: Color(0xFF1A1F36)),
                    decoration: InputDecoration(
                      hintText: 'Type your reply...',
                      hintStyle: TextStyle(
                          color: Colors.grey.shade400, fontSize: 14),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Send button
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                child: GestureDetector(
                  onTap: _sending ? null : _sendMessage,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: _isTyping
                            ? [_accent, const Color(0xFF8B85FF)]
                            : [Colors.grey.shade300, Colors.grey.shade300],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: _isTyping
                          ? [
                              BoxShadow(
                                color: _accent.withOpacity(0.4),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ]
                          : [],
                    ),
                    child: Center(
                      child: _sending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2),
                            )
                          : Icon(
                              Icons.send_rounded,
                              color: _isTyping
                                  ? Colors.white
                                  : Colors.grey.shade500,
                              size: 20,
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
