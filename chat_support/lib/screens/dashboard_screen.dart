import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import 'admin_panel_screen.dart';
import 'chat_screen.dart';
import 'pricing_plans_screen.dart';

class DashboardScreen extends StatefulWidget {
  final ApiService api;

  const DashboardScreen({super.key, required this.api});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  Stats? _stats;
  List<Conversation> _conversations = [];
  bool _loading = true;
  String _filter = 'all';
  Timer? _refreshTimer;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  // Design tokens
  static const Color _accent = Color(0xFF6C63FF);
  static const Color _surface = Color(0xFFF0F2F8);

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim =
        CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _loadData();
    _refreshTimer =
        Timer.periodic(const Duration(seconds: 10), (_) => _loadData());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final stats = await widget.api.getStats();
      final convos = await widget.api.getConversations(
        status: _filter == 'all' ? null : _filter,
      );
      if (mounted) {
        setState(() {
          _stats = stats;
          _conversations = convos;
          _loading = false;
        });
        _animController.forward(from: 0);
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatTime(String isoStr) {
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m';
      if (diff.inHours < 24) return '${diff.inHours}h';
      return '${diff.inDays}d';
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

  IconData _statusIcon(String status) {
    switch (status) {
      case 'open':
        return Icons.fiber_new_rounded;
      case 'agent_assigned':
        return Icons.headset_mic_rounded;
      case 'resolved':
        return Icons.check_circle_rounded;
      case 'closed':
        return Icons.cancel_rounded;
      default:
        return Icons.help_rounded;
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
        return status.replaceAll('_', ' ');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surface,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildInboxTab(),
          AdminPanelScreen(api: widget.api),
          PricingPlansScreen(api: widget.api),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              _buildNavItem(0, Icons.inbox_rounded, Icons.inbox_rounded, 'Inbox'),
              _buildNavItem(1, Icons.admin_panel_settings_rounded,
                  Icons.admin_panel_settings_rounded, 'Admin'),
              _buildNavItem(2, Icons.currency_rupee_rounded,
                  Icons.currency_rupee_rounded, 'Pricing'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, IconData activeIcon, String label) {
    final selected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentIndex = index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                decoration: BoxDecoration(
                  color: selected
                      ? _accent.withOpacity(0.12)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  selected ? activeIcon : icon,
                  color: selected ? _accent : Colors.grey.shade400,
                  size: 22,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? _accent : Colors.grey.shade400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInboxTab() {
    return Column(
      children: [
        _buildHeader(),
        if (_stats != null) _buildStatsRow(),
        _buildFilterRow(),
        Expanded(child: _buildConversationList()),
      ],
    );
  }

  Widget _buildHeader() {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A2540), Color(0xFF1A1F50)],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 16, 24),
          child: Row(
            children: [
              // Logo
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
                  ),
                  borderRadius: BorderRadius.circular(13),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6C63FF).withOpacity(0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.support_agent_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$greeting 👋',
                      style: GoogleFonts.inter(
                        color: Colors.white70,
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                    Text(
                      'Support Inbox',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ],
                ),
              ),
              // Refresh button
              Material(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () {
                    setState(() => _loading = true);
                    _loadData();
                  },
                  child: const Padding(
                    padding: EdgeInsets.all(10),
                    child: Icon(Icons.refresh_rounded,
                        color: Colors.white70, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    final cards = [
      _StatData('Total', _stats!.total, const Color(0xFF6C63FF),
          Icons.forum_rounded),
      _StatData('Open', _stats!.open, const Color(0xFFFF7849),
          Icons.fiber_new_rounded),
      _StatData('Active', _stats!.agentAssigned, const Color(0xFF4F83F1),
          Icons.headset_mic_rounded),
      _StatData('Resolved', _stats!.resolved, const Color(0xFF25D366),
          Icons.check_circle_rounded),
    ];

    return Container(
      color: const Color(0xFF0A2540),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFF0F2F8),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Row(
            children: cards
                .map((d) => Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: _buildStatCard(d),
                      ),
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(_StatData data) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: data.color.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: data.color.withOpacity(0.12)),
      ),
      child: Column(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: data.color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(data.icon, color: data.color, size: 16),
          ),
          const SizedBox(height: 8),
          Text(
            data.value.toString(),
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: data.color,
              letterSpacing: -0.5,
            ),
          ),
          Text(
            data.label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: data.color.withOpacity(0.7),
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterRow() {
    final filters = [
      ('all', 'All'),
      ('open', '🔴 Open'),
      ('agent_assigned', '🔵 Active'),
      ('resolved', '✅ Resolved'),
      ('closed', '⚫ Closed'),
    ];

    return Container(
      color: _surface,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: filters
              .map((f) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _buildFilterChip(f.$1, f.$2),
                  ))
              .toList(),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final selected = _filter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _filter = value;
          _loading = true;
        });
        _loadData();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? _accent : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected ? _accent : Colors.grey.shade200,
            width: 1.5,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: _accent.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ],
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: selected ? Colors.white : Colors.grey.shade600,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildConversationList() {
    if (_loading) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, __) => _buildSkeletonCard(),
      );
    }

    if (_conversations.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _accent.withOpacity(0.1),
                    _accent.withOpacity(0.05),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.inbox_rounded,
                  size: 40, color: _accent.withOpacity(0.5)),
            ),
            const SizedBox(height: 20),
            Text(
              'All caught up!',
              style: GoogleFonts.inter(
                color: const Color(0xFF0A2540),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'No conversations match this filter',
              style: GoogleFonts.inter(
                  color: Colors.grey.shade400, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return FadeTransition(
      opacity: _fadeAnim,
      child: RefreshIndicator(
        onRefresh: _loadData,
        color: _accent,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          itemCount: _conversations.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            return _buildConversationCard(_conversations[index]);
          },
        ),
      ),
    );
  }

  Widget _buildSkeletonCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 14,
                  width: 140,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(7),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 12,
                  width: 100,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 12,
                  width: 180,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationCard(Conversation convo) {
    final statusColor = _statusColor(convo.status);
    final statusIcon = _statusIcon(convo.status);
    final isOpen = convo.status == 'open';
    final name = convo.userName ?? convo.userEmail;
    final initials = name.length >= 2
        ? name.substring(0, 2).toUpperCase()
        : name[0].toUpperCase();

    final avatarGradients = [
      [const Color(0xFF6C63FF), const Color(0xFF4F83F1)],
      [const Color(0xFFFF7849), const Color(0xFFFF5252)],
      [const Color(0xFF27AE60), const Color(0xFF25D366)],
      [const Color(0xFFE91E8C), const Color(0xFFAD1457)],
      [const Color(0xFF0288D1), const Color(0xFF0097A7)],
    ];
    final gradColors =
        avatarGradients[name.codeUnitAt(0) % avatarGradients.length];

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            PageRouteBuilder(
              pageBuilder: (_, anim, __) =>
                  ChatScreen(api: widget.api, conversation: convo),
              transitionsBuilder: (_, anim, __, child) => SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(1, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
                child: child,
              ),
              transitionDuration: const Duration(milliseconds: 350),
            ),
          ).then((_) => _loadData());
        },
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isOpen
                  ? statusColor.withOpacity(0.25)
                  : Colors.grey.shade100,
              width: isOpen ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: isOpen
                    ? statusColor.withOpacity(0.08)
                    : Colors.black.withOpacity(0.04),
                blurRadius: isOpen ? 12 : 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              // Avatar with status dot
              Stack(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: gradColors,
                      ),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: -1,
                    bottom: -1,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Center(
                        child: Icon(statusIcon, size: 7, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: GoogleFonts.inter(
                              fontWeight: isOpen
                                  ? FontWeight.w700
                                  : FontWeight.w600,
                              fontSize: 14,
                              color: const Color(0xFF0A2540),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatTime(convo.updatedAt),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.grey.shade400,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      convo.userEmail,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey.shade400,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 7),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            convo.subject ?? 'General Support',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.grey.shade500,
                              fontWeight: FontWeight.w400,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(statusIcon,
                                  size: 9, color: statusColor),
                              const SizedBox(width: 4),
                              Text(
                                _statusLabel(convo.status),
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: statusColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Icon(Icons.chevron_right_rounded,
                  color: Colors.grey.shade300, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatData {
  final String label;
  final int value;
  final Color color;
  final IconData icon;

  const _StatData(this.label, this.value, this.color, this.icon);
}
