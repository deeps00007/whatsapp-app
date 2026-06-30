import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class AdminPanelScreen extends StatefulWidget {
  final ApiService api;

  const AdminPanelScreen({super.key, required this.api});

  @override
  State<AdminPanelScreen> createState() => _AdminPanelScreenState();
}

class _AdminPanelScreenState extends State<AdminPanelScreen>
    with SingleTickerProviderStateMixin {
  List<dynamic> _users = [];
  bool _loading = true;
  String? _error;
  Timer? _refreshTimer;
  String _searchQuery = '';
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  static const Color _accent = Color(0xFF6C63FF);
  static const Color _surface = Color(0xFFF0F2F8);

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _loadData();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _loadData(),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final data = await widget.api.getAdminUsers();
      if (mounted) {
        setState(() {
          _users = data['users'] ?? [];
          _loading = false;
          _error = null;
        });
        _animCtrl.forward(from: 0);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  String _formatDate(String? isoStr) {
    if (isoStr == null) return '-';
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '-';
    }
  }

  List<dynamic> get _filteredUsers {
    if (_searchQuery.isEmpty) return _users;
    return _users.where((u) {
      final name = (u['full_name'] ?? '').toString().toLowerCase();
      final email = (u['email'] ?? '').toString().toLowerCase();
      final q = _searchQuery.toLowerCase();
      return name.contains(q) || email.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surface,
      body: Column(
        children: [
          _buildHeader(),
          if (!_loading && _error == null && _users.isNotEmpty) _buildSearch(),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final total = _users.length;
    final paid = _users
        .where((u) => u['subscription']?['active'] == true)
        .length;
    final connected = _users
        .where((u) => u['whatsapp']?['connected'] == true)
        .length;

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
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
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
                      Icons.admin_panel_settings_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Admin Panel',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.4,
                          ),
                        ),
                        Text(
                          'Users, subscriptions & connections',
                          style: GoogleFonts.inter(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
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
                        child: Icon(
                          Icons.refresh_rounded,
                          color: Colors.white70,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Summary pills
            if (!_loading && _error == null && total > 0)
              Container(
                color: const Color(0xFF0A2540),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0F2F8),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(28),
                      topRight: Radius.circular(28),
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                  child: Row(
                    children: [
                      _buildSummaryPill(
                        '$total Users',
                        Icons.group_rounded,
                        const Color(0xFF6C63FF),
                      ),
                      const SizedBox(width: 10),
                      _buildSummaryPill(
                        '$paid Paid',
                        Icons.verified_rounded,
                        const Color(0xFF25D366),
                      ),
                      const SizedBox(width: 10),
                      _buildSummaryPill(
                        '$connected Online',
                        Icons.wifi_rounded,
                        const Color(0xFF4F83F1),
                      ),
                    ],
                  ),
                ),
              )
            else
              Container(
                height: 28,
                color: const Color(0xFF0A2540),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0F2F8),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(28),
                      topRight: Radius.circular(28),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryPill(String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0A2540),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearch() {
    return Container(
      color: _surface,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: TextField(
          onChanged: (v) => setState(() => _searchQuery = v),
          style: GoogleFonts.inter(
            fontSize: 14,
            color: const Color(0xFF0A2540),
          ),
          decoration: InputDecoration(
            hintText: 'Search users by name or email...',
            hintStyle: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.grey.shade400,
            ),
            prefixIcon: Icon(
              Icons.search_rounded,
              color: Colors.grey.shade400,
              size: 20,
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => _buildSkeletonCard(),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.error_outline_rounded,
                  color: Colors.red.shade400,
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Unable to load users',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0A2540),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: Colors.grey.shade500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() => _loading = true);
                  _loadData();
                },
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final users = _filteredUsers;
    if (users.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.person_search_rounded,
              size: 52,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 14),
            Text(
              _searchQuery.isEmpty ? 'No users found' : 'No results found',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade600,
              ),
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
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          itemCount: users.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (ctx, i) => _buildUserCard(users[i]),
        ),
      ),
    );
  }

  Widget _buildSkeletonCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
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
                  width: 160,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(7),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 12,
                  width: 220,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: List.generate(
                    4,
                    (_) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Container(
                        height: 24,
                        width: 60,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(dynamic user) {
    final name = user['full_name'] ?? user['email'] ?? 'Unknown';
    final subscription = user['subscription'] ?? {};
    final whatsapp = user['whatsapp'];
    final isSubActive = subscription['active'] == true;
    final isConnected = whatsapp != null && whatsapp['connected'] == true;
    final isPhoneVerified =
        whatsapp != null && whatsapp['phone_verified'] == true;
    final isPaymentConnected =
        whatsapp != null && whatsapp['payment_method_connected'] == true;
    final isAdmin = user['role'] == 'admin';

    // Avatar color from name
    final avatarGradients = [
      [const Color(0xFF6C63FF), const Color(0xFF4F83F1)],
      [const Color(0xFFFF7849), const Color(0xFFFF5252)],
      [const Color(0xFF27AE60), const Color(0xFF25D366)],
      [const Color(0xFFE91E8C), const Color(0xFFAD1457)],
      [const Color(0xFF0288D1), const Color(0xFF0097A7)],
    ];
    final gColors =
        avatarGradients[name.toString().codeUnitAt(0) % avatarGradients.length];
    final initials = name.toString().length >= 2
        ? name.toString().substring(0, 2).toUpperCase()
        : name.toString()[0].toUpperCase();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => _showUserDetailsSheet(user['user_id']),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Avatar
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: gColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Name + email
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                name.toString(),
                                style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0A2540),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isAdmin)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF6C63FF),
                                      Color(0xFF4F83F1),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'ADMIN',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          user['email'] ?? '',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey.shade400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: Colors.grey.shade300,
                    size: 20,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // Status pills
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _buildStatusPill(
                    isSubActive ? 'Paid' : 'Unpaid',
                    isSubActive
                        ? const Color(0xFF25D366)
                        : const Color(0xFFFF5252),
                    isSubActive
                        ? Icons.verified_rounded
                        : Icons.payment_rounded,
                  ),
                  _buildStatusPill(
                    isConnected ? 'Connected' : 'Offline',
                    isConnected
                        ? const Color(0xFF4F83F1)
                        : const Color(0xFF9E9E9E),
                    isConnected ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                  ),
                  _buildStatusPill(
                    isPhoneVerified ? 'Verified' : 'Unverified',
                    isPhoneVerified
                        ? const Color(0xFF25D366)
                        : const Color(0xFFFFA726),
                    isPhoneVerified
                        ? Icons.phone_rounded
                        : Icons.phone_disabled_rounded,
                  ),
                  _buildStatusPill(
                    isPaymentConnected ? 'Meta Pay' : 'No Meta Pay',
                    isPaymentConnected
                        ? const Color(0xFF25D366)
                        : const Color(0xFFFFA726),
                    Icons.credit_card_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Footer row: joined date + manage plan button
              Row(
                children: [
                  Icon(
                    Icons.calendar_today_rounded,
                    size: 11,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Joined ${_formatDate(user['created_at'])}',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.grey.shade400,
                    ),
                  ),
                  if (subscription['expires_at'] != null) ...[
                    const SizedBox(width: 8),
                    Icon(
                      Icons.access_time_rounded,
                      size: 11,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Exp: ${_formatDate(subscription['expires_at'])}',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.grey.shade400,
                      ),
                    ),
                  ],
                  const Spacer(),
                  // Quick manage plan button
                  GestureDetector(
                    onTap: () => _showAssignPlanSheet(
                      context,
                      user['user_id'],
                      isSubActive,
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isSubActive
                              ? [
                                  const Color(0xFFFF5252),
                                  const Color(0xFFFF1744),
                                ]
                              : [
                                  const Color(0xFF6C63FF),
                                  const Color(0xFF4F83F1),
                                ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color:
                                (isSubActive
                                        ? const Color(0xFFFF5252)
                                        : const Color(0xFF6C63FF))
                                    .withOpacity(0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isSubActive
                                ? Icons.block_rounded
                                : Icons.card_membership_rounded,
                            size: 11,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isSubActive ? 'Revoke' : 'Assign Plan',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAssignPlanSheet(
    BuildContext context,
    String userId,
    bool currentlyActive,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _AssignPlanSheet(
        api: widget.api,
        userId: userId,
        currentlyActive: currentlyActive,
        onSuccess: _loadData,
      ),
    );
  }

  Widget _buildStatusPill(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  void _showUserDetailsSheet(String userId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _UserDetailsSheet(
        api: widget.api,
        userId: userId,
        onRefresh: _loadData,
      ),
    );
  }
}

class _UserDetailsSheet extends StatefulWidget {
  final ApiService api;
  final String userId;
  final VoidCallback? onRefresh;

  const _UserDetailsSheet({
    required this.api,
    required this.userId,
    this.onRefresh,
  });

  @override
  State<_UserDetailsSheet> createState() => _UserDetailsSheetState();
}

class _UserDetailsSheetState extends State<_UserDetailsSheet> {
  Map<String, dynamic>? _user;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await widget.api.getAdminUserDetails(widget.userId);
      if (mounted) {
        setState(() {
          _user = data['user'];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  String _formatDate(String? isoStr) {
    if (isoStr == null) return '-';
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '-';
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (ctx, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle + header
            Container(
              padding: const EdgeInsets.fromLTRB(24, 14, 24, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(28),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Text(
                        'User Details',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0A2540),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: Colors.black54,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: _loading
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const CircularProgressIndicator(
                            color: Color(0xFF6C63FF),
                            strokeWidth: 2.5,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Loading user details...',
                            style: GoogleFonts.inter(
                              color: Colors.grey.shade500,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    )
                  : _error != null
                  ? Center(
                      child: Text(
                        _error!,
                        style: GoogleFonts.inter(
                          color: Colors.red.shade400,
                          fontSize: 13,
                        ),
                      ),
                    )
                  : _user == null
                  ? Center(
                      child: Text(
                        'User not found',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    )
                  : ListView(
                      controller: scrollCtrl,
                      padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
                      children: [
                        _buildSection(
                          'Profile',
                          Icons.person_rounded,
                          const Color(0xFF6C63FF),
                          [
                            _buildRow('Name', _user!['full_name'] ?? '-'),
                            _buildRow('Email', _user!['email'] ?? '-'),
                            _buildRow('Role', _user!['role'] ?? 'user'),
                            _buildRow(
                              'Joined',
                              _formatDate(_user!['created_at']),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildSection(
                          'Subscription',
                          Icons.verified_rounded,
                          const Color(0xFF25D366),
                          [
                            _buildRow(
                              'Status',
                              (_user!['subscription']?['active'] == true)
                                  ? 'Active'
                                  : 'Inactive',
                              valueColor:
                                  (_user!['subscription']?['active'] == true)
                                  ? const Color(0xFF25D366)
                                  : const Color(0xFFFF5252),
                            ),
                            _buildRow(
                              'Expires',
                              _formatDate(
                                _user!['subscription']?['expires_at'],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildSection(
                          'WhatsApp',
                          Icons.phone_android_rounded,
                          const Color(0xFF4F83F1),
                          [
                            _buildRow(
                              'Connected',
                              (_user!['whatsapp']?['connected'] == true)
                                  ? 'Yes'
                                  : 'No',
                              valueColor:
                                  (_user!['whatsapp']?['connected'] == true)
                                  ? const Color(0xFF25D366)
                                  : const Color(0xFFFF5252),
                            ),
                            _buildRow(
                              'Status',
                              _user!['whatsapp']?['status'] ?? 'Not configured',
                            ),
                            _buildRow(
                              'Phone Number',
                              _user!['whatsapp']?['phone_number'] ?? '-',
                            ),
                            _buildRow(
                              'Business Name',
                              _user!['whatsapp']?['business_name'] ?? '-',
                            ),
                            _buildRow(
                              'Phone Verified',
                              (_user!['whatsapp']?['phone_verified'] == true)
                                  ? 'Verified ✓'
                                  : 'Not Verified',
                              valueColor:
                                  (_user!['whatsapp']?['phone_verified'] ==
                                      true)
                                  ? const Color(0xFF25D366)
                                  : const Color(0xFFFFA726),
                            ),
                            _buildRow(
                              'Meta Payment',
                              (_user!['whatsapp']?['payment_method_connected'] ==
                                      true)
                                  ? 'Connected'
                                  : 'Not connected',
                              valueColor:
                                  (_user!['whatsapp']?['payment_method_connected'] ==
                                      true)
                                  ? const Color(0xFF25D366)
                                  : const Color(0xFFFFA726),
                            ),
                            _buildRow(
                              'Quality Rating',
                              _user!['whatsapp']?['quality_rating'] ?? '-',
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildSection(
                          'Activity',
                          Icons.bar_chart_rounded,
                          const Color(0xFFFF7849),
                          [
                            _buildRow(
                              'Contacts',
                              (_user!['counts']?['contacts'] ?? 0).toString(),
                            ),
                            _buildRow(
                              'Support Chats',
                              (_user!['counts']?['support_conversations'] ?? 0)
                                  .toString(),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // ── Manage Plan section ──
                        _buildManagePlanCard(),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildManagePlanCard() {
    final isActive = _user!['subscription']?['active'] == true;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isActive
              ? [const Color(0xFFFFF0F0), const Color(0xFFFFF5F5)]
              : [const Color(0xFFF0F0FF), const Color(0xFFF5F5FF)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive
              ? const Color(0xFFFF5252).withOpacity(0.2)
              : const Color(0xFF6C63FF).withOpacity(0.2),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isActive
                        ? const Color(0xFFFF5252).withOpacity(0.12)
                        : const Color(0xFF6C63FF).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.card_membership_rounded,
                    size: 17,
                    color: isActive
                        ? const Color(0xFFFF5252)
                        : const Color(0xFF6C63FF),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Manage Plan',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0A2540),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isActive
                        ? const Color(0xFF25D366).withOpacity(0.12)
                        : const Color(0xFFFF5252).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isActive ? 'Currently Active' : 'No Active Plan',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isActive
                          ? const Color(0xFF25D366)
                          : const Color(0xFFFF5252),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'Manually assign or revoke a subscription to bypass payment requirements.',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: Colors.grey.shade500,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),
            // Assign button
            SizedBox(
              width: double.infinity,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6C63FF), Color(0xFF4F83F1)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6C63FF).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: Colors.transparent,
                      isScrollControlled: true,
                      builder: (ctx) => _AssignPlanSheet(
                        api: widget.api,
                        userId: widget.userId,
                        currentlyActive: isActive,
                        onSuccess: () {
                          widget.onRefresh?.call();
                          _load();
                        },
                      ),
                    );
                  },
                  icon: const Icon(Icons.edit_rounded, size: 16),
                  label: Text(
                    'Open Plan Manager',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
            if (isActive) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    showModalBottomSheet(
                      context: context,
                      backgroundColor: Colors.transparent,
                      isScrollControlled: true,
                      builder: (ctx) => _AssignPlanSheet(
                        api: widget.api,
                        userId: widget.userId,
                        currentlyActive: isActive,
                        revokeMode: true,
                        onSuccess: () {
                          widget.onRefresh?.call();
                          _load();
                        },
                      ),
                    );
                  },
                  icon: const Icon(Icons.block_rounded, size: 16),
                  label: Text(
                    'Revoke Subscription',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFFF5252),
                    side: const BorderSide(
                      color: Color(0xFFFF5252),
                      width: 1.5,
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    String title,
    IconData icon,
    Color color,
    List<Widget> rows,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Icon(icon, size: 16, color: color),
                ),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0A2540),
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: color.withOpacity(0.1)),
          ...rows,
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: valueColor ?? const Color(0xFF0A2540),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Assign / Revoke Plan Bottom Sheet
// ─────────────────────────────────────────────────────────────────

class _AssignPlanSheet extends StatefulWidget {
  final ApiService api;
  final String userId;
  final bool currentlyActive;
  final bool revokeMode;
  final VoidCallback? onSuccess;

  const _AssignPlanSheet({
    required this.api,
    required this.userId,
    required this.currentlyActive,
    this.revokeMode = false,
    this.onSuccess,
  });

  @override
  State<_AssignPlanSheet> createState() => _AssignPlanSheetState();
}

class _AssignPlanSheetState extends State<_AssignPlanSheet> {
  bool _loading = false;
  bool _revoking = false;
  int _selectedDays = 30;
  final _planController = TextEditingController(text: 'manual');
  String? _resultMessage;
  bool _success = false;

  static const _presets = [
    (7, '7 Days'),
    (30, '1 Month'),
    (90, '3 Months'),
    (365, '1 Year'),
  ];

  @override
  void initState() {
    super.initState();
    _revoking = widget.revokeMode;
  }

  @override
  void dispose() {
    _planController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _resultMessage = null;
    });
    try {
      await widget.api.manageSubscription(
        widget.userId,
        active: !_revoking,
        days: _revoking ? 0 : _selectedDays,
        plan: _revoking
            ? 'none'
            : _planController.text.trim().isEmpty
            ? 'manual'
            : _planController.text.trim(),
      );
      widget.onSuccess?.call();
      if (mounted) {
        setState(() {
          _success = true;
          _resultMessage = _revoking
              ? 'Subscription revoked successfully.'
              : 'Plan assigned for $_selectedDays days!';
          _loading = false;
        });
        // Auto-close after success
        Future.delayed(const Duration(seconds: 1800), () {
          if (mounted) Navigator.pop(context);
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _success = false;
          _resultMessage = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRevoke = _revoking;
    final accentColor = isRevoke
        ? const Color(0xFFFF5252)
        : const Color(0xFF6C63FF);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 14, 24, 36),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Header
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: Icon(
                      isRevoke
                          ? Icons.block_rounded
                          : Icons.card_membership_rounded,
                      color: accentColor,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isRevoke ? 'Revoke Subscription' : 'Assign Manual Plan',
                        style: GoogleFonts.inter(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0A2540),
                        ),
                      ),
                      Text(
                        isRevoke
                            ? 'Remove active subscription access'
                            : 'Bypass payment — grant direct access',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              if (!isRevoke) ...[
                // Duration presets
                Text(
                  'Duration',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0A2540),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: _presets.map((p) {
                    final selected = _selectedDays == p.$1;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedDays = p.$1),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            decoration: BoxDecoration(
                              gradient: selected
                                  ? const LinearGradient(
                                      colors: [
                                        Color(0xFF6C63FF),
                                        Color(0xFF4F83F1),
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    )
                                  : null,
                              color: selected ? null : const Color(0xFFF5F6FA),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected
                                    ? Colors.transparent
                                    : Colors.grey.shade200,
                              ),
                              boxShadow: selected
                                  ? [
                                      BoxShadow(
                                        color: const Color(
                                          0xFF6C63FF,
                                        ).withOpacity(0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      ),
                                    ]
                                  : [],
                            ),
                            child: Center(
                              child: Text(
                                p.$2,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: selected
                                      ? Colors.white
                                      : Colors.grey.shade600,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),

                // Plan name
                Text(
                  'Plan Label',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0A2540),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _planController,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF0A2540),
                  ),
                  decoration: InputDecoration(
                    hintText: 'e.g. manual, trial, promo',
                    hintStyle: GoogleFonts.inter(
                      fontSize: 13,
                      color: Colors.grey.shade400,
                    ),
                    prefixIcon: const Icon(
                      Icons.label_outline_rounded,
                      size: 18,
                      color: Color(0xFF6C63FF),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8F9FF),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade200),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: Color(0xFF6C63FF),
                        width: 1.8,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              if (isRevoke) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF0F0),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFFCDD2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.warning_amber_rounded,
                        color: Color(0xFFE53935),
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'This will immediately deactivate the user\'s subscription. They will lose access to paid features.',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFFB71C1C),
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Result message
              if (_resultMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _success
                          ? const Color(0xFFF0FFF4)
                          : const Color(0xFFFFF0F0),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _success
                            ? const Color(0xFF25D366)
                            : const Color(0xFFFF5252),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _success
                              ? Icons.check_circle_rounded
                              : Icons.error_outline_rounded,
                          color: _success
                              ? const Color(0xFF25D366)
                              : const Color(0xFFFF5252),
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _resultMessage!,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: _success
                                  ? const Color(0xFF1B5E20)
                                  : const Color(0xFFB71C1C),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Action button
              SizedBox(
                width: double.infinity,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isRevoke
                          ? [const Color(0xFFFF5252), const Color(0xFFFF1744)]
                          : [const Color(0xFF6C63FF), const Color(0xFF4F83F1)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: accentColor.withOpacity(0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Text(
                            isRevoke
                                ? 'Confirm Revoke'
                                : 'Assign Plan for $_selectedDays Days',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
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
