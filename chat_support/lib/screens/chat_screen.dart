import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
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
  String _currentStatus = '';

  // Design palette
  static const Color _accent = Color(0xFF6C63FF);
  static const Color _agentBubble = Color(0xFFEEEDF9);
  static const Color _userBubble = Color(0xFF6C63FF);
  static const Color _botBubble = Color(0xFFF3F0FF);
  static const Color _bgColor = Color(0xFFF0F2F8);

  late AnimationController _typingDotCtrl;
  late AnimationController _sendBtnCtrl;
  late Animation<double> _sendBtnScale;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.conversation.status;

    _typingDotCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _sendBtnCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _sendBtnScale = Tween<double>(begin: 1.0, end: 0.92).animate(
      CurvedAnimation(parent: _sendBtnCtrl, curve: Curves.easeInOut),
    );

    _loadMessages();
    _pollTimer =
        Timer.periodic(const Duration(seconds: 3), (_) => _pollNewMessages());
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 5), (_) {
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
    _typingDotCtrl.dispose();
    _sendBtnCtrl.dispose();
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
    await _sendBtnCtrl.forward();
    await _sendBtnCtrl.reverse();

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
      setState(() => _currentStatus = status);
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
          Expanded(child: Text(msg, style: GoogleFonts.inter(color: Colors.white))),
        ],
      ),
      backgroundColor: const Color(0xFFE53935),
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 3),
    ));
  }

  void _showSuccessSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Expanded(child: Text(msg, style: GoogleFonts.inter(color: Colors.white))),
        ],
      ),
      backgroundColor: const Color(0xFF25D366),
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  void _showStatusSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildStatusSheet(ctx),
    );
  }

  Widget _buildStatusSheet(BuildContext ctx) {
    final options = [
      ('agent_assigned', 'Mark as Active', Icons.headset_mic_rounded,
          const Color(0xFF4F83F1)),
      ('resolved', 'Mark as Resolved', Icons.check_circle_rounded,
          const Color(0xFF25D366)),
      ('closed', 'Close Conversation', Icons.cancel_rounded,
          const Color(0xFF9E9E9E)),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Update Conversation Status',
            style: GoogleFonts.inter(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0A2540),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose the new status for this conversation',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 20),
          ...options.map((opt) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Material(
                  color: opt.$4.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () {
                      Navigator.pop(ctx);
                      _updateStatus(opt.$1);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: opt.$4.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(opt.$3, color: opt.$4, size: 20),
                          ),
                          const SizedBox(width: 14),
                          Text(
                            opt.$2,
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0A2540),
                            ),
                          ),
                          const Spacer(),
                          if (_currentStatus == opt.$1)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: opt.$4.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Current',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: opt.$4,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              )),
        ],
      ),
    );
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
      if (dt.day == now.day &&
          dt.month == now.month &&
          dt.year == now.year) {
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
        return const Color(0xFF25D366);
      case 'closed':
        return const Color(0xFF9E9E9E);
      default:
        return const Color(0xFF9E9E9E);
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'open':
        return 'Open';
      case 'agent_assigned':
        return 'Active';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.conversation.userName ?? widget.conversation.userEmail;
    final initials = name.length >= 2
        ? name.substring(0, 2).toUpperCase()
        : name[0].toUpperCase();
    final statusColor = _statusColor(_currentStatus);

    return Scaffold(
      backgroundColor: _bgColor,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(76),
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
          colors: [Color(0xFF0A2540), Color(0xFF1A1F50)],
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x44000000),
            blurRadius: 16,
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
              // Back
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white70, size: 18),
                onPressed: () => Navigator.pop(context),
              ),
              // Avatar
              Stack(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 13,
                      height: 13,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: const Color(0xFF0A2540), width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              // Title + status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _statusLabel(_currentStatus),
                            style: GoogleFonts.inter(
                              color: statusColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // More options
              Material(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: _showStatusSheet,
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.more_vert_rounded,
                        color: Colors.white70, size: 22),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageList() {
    if (_loading) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              color: _accent,
              strokeWidth: 2.5,
            ),
            const SizedBox(height: 14),
            Text(
              'Loading messages...',
              style: GoogleFonts.inter(
                  color: Colors.grey.shade500, fontSize: 13),
            ),
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
            Text(
              'No messages yet',
              style: GoogleFonts.inter(
                color: const Color(0xFF0A2540),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Start the conversation below',
              style: GoogleFonts.inter(
                  color: Colors.grey.shade400, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        final isLeft = msg.isAgent || msg.isBot;
        final showDate = _shouldShowDateDivider(index);

        return Column(
          children: [
            if (showDate) _buildDateDivider(msg.createdAt),
            _buildMessageBubble(msg, isLeft, index),
          ],
        );
      },
    );
  }

  Widget _buildDateDivider(String isoStr) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                _formatDate(isoStr),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: Colors.grey.shade500,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(SupportMessage msg, bool isLeft, int index) {
    final showAvatar = isLeft &&
        (index == 0 || _messages[index - 1].senderType != msg.senderType);

    Color bubbleColor;
    Color textColor;
    Color timeColor;

    if (msg.isAgent) {
      bubbleColor = _agentBubble;
      textColor = const Color(0xFF1A1F36);
      timeColor = Colors.grey.shade400;
    } else if (msg.isBot) {
      bubbleColor = _botBubble;
      textColor = const Color(0xFF3D3480);
      timeColor = Colors.grey.shade400;
    } else {
      bubbleColor = _userBubble;
      textColor = Colors.white;
      timeColor = Colors.white.withOpacity(0.65);
    }

    final isGrouped = !showAvatar && isLeft;

    return Padding(
      padding: EdgeInsets.only(
        bottom: isGrouped ? 2 : 6,
        left: isLeft ? 0 : 52,
        right: isLeft ? 52 : 0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment:
            isLeft ? MainAxisAlignment.start : MainAxisAlignment.end,
        children: [
          if (isLeft) ...[
            if (showAvatar)
              _buildSenderAvatar(msg)
            else
              const SizedBox(width: 30),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isLeft ? CrossAxisAlignment.start : CrossAxisAlignment.end,
              children: [
                if (isLeft && showAvatar && msg.senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 4),
                    child: Text(
                      msg.senderName!,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: msg.isBot
                            ? const Color(0xFF6C63FF)
                            : const Color(0xFF27AE60),
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
                      bottomLeft: Radius.circular(isLeft ? (showAvatar ? 6 : 18) : 18),
                      bottomRight: Radius.circular(isLeft ? 18 : 6),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (msg.isUser ? _accent : Colors.black)
                            .withOpacity(0.08),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (msg.isBot)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6C63FF).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.auto_awesome_rounded,
                                    size: 11, color: Color(0xFF6C63FF)),
                                const SizedBox(width: 4),
                                Text(
                                  'AI Assistant',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: const Color(0xFF6C63FF),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      Text(
                        msg.content,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: textColor,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _formatTime(msg.createdAt),
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: timeColor,
                            ),
                          ),
                          if (!isLeft) ...[
                            const SizedBox(width: 4),
                            Icon(
                              Icons.done_all_rounded,
                              size: 14,
                              color: Colors.white.withOpacity(0.7),
                            ),
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
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6C63FF).withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Icon(Icons.auto_awesome_rounded,
            size: 14, color: Colors.white),
      );
    }
    return Container(
      width: 30,
      height: 30,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF25D366), Color(0xFF27AE60)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.support_agent_rounded,
          size: 16, color: Colors.white),
    );
  }

  Widget _buildInputBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 20,
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
              // Attach button
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {},
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Icon(Icons.add_circle_outline_rounded,
                          color: Colors.grey.shade400, size: 22),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              // Input field
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 130),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F6FA),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: _isTyping
                          ? _accent.withOpacity(0.3)
                          : Colors.grey.shade200,
                      width: 1.5,
                    ),
                  ),
                  child: TextField(
                    controller: _messageController,
                    focusNode: _focusNode,
                    maxLines: null,
                    keyboardType: TextInputType.multiline,
                    textCapitalization: TextCapitalization.sentences,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF0A2540),
                      fontWeight: FontWeight.w400,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Type your reply...',
                      hintStyle: GoogleFonts.inter(
                          color: Colors.grey.shade400, fontSize: 14),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 18, vertical: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Send button
              ScaleTransition(
                scale: _sendBtnScale,
                child: GestureDetector(
                  onTap: _sending ? null : _sendMessage,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      gradient: _isTyping
                          ? const LinearGradient(
                              colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : LinearGradient(
                              colors: [
                                Colors.grey.shade200,
                                Colors.grey.shade200,
                              ],
                            ),
                      shape: BoxShape.circle,
                      boxShadow: _isTyping
                          ? [
                              BoxShadow(
                                color: _accent.withOpacity(0.35),
                                blurRadius: 12,
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
                                  : Colors.grey.shade400,
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
