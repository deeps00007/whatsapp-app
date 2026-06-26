import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';

class AdminPanelScreen extends StatefulWidget {
  final ApiService api;

  const AdminPanelScreen({super.key, required this.api});

  @override
  State<AdminPanelScreen> createState() => _AdminPanelScreenState();
}

class _AdminPanelScreenState extends State<AdminPanelScreen> {
  List<dynamic> _users = [];
  bool _loading = true;
  String? _error;
  Timer? _refreshTimer;

  final _accent = const Color(0xFF075E54);
  final _surface = const Color(0xFFF0F2F5);

  @override
  void initState() {
    super.initState();
    _loadData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadData());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
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

  Color _statusColor(bool active) {
    return active ? const Color(0xFF25D366) : const Color(0xFFFF6B6B);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surface,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF075E54)))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.error_outline, color: Colors.red[400], size: 48),
                            const SizedBox(height: 12),
                            Text(_error!, style: TextStyle(color: Colors.red[700], fontSize: 14)),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () {
                                setState(() => _loading = true);
                                _loadData();
                              },
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _users.isEmpty
                        ? const Center(child: Text('No users found'))
                        : RefreshIndicator(
                            onRefresh: _loadData,
                            color: const Color(0xFF075E54),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _users.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) => _buildUserCard(_users[index]),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      color: _accent,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Row(
            children: [
              const Icon(Icons.admin_panel_settings, color: Colors.white, size: 32),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Admin Panel',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Users, payments & connection status',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Material(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () {
                    setState(() => _loading = true);
                    _loadData();
                  },
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.refresh, color: Colors.white70, size: 22),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUserCard(dynamic user) {
    final name = user['full_name'] ?? user['email'] ?? 'Unknown';
    final subscription = user['subscription'] ?? {};
    final whatsapp = user['whatsapp'];
    final isSubActive = subscription['active'] == true;
    final isConnected = whatsapp != null && whatsapp['connected'] == true;
    final isPhoneVerified = whatsapp != null && whatsapp['phone_verified'] == true;
    final isPaymentConnected = whatsapp != null && whatsapp['payment_method_connected'] == true;
    final isAdmin = user['role'] == 'admin';

    return Card(
      elevation: 1,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showUserDetails(user['user_id']),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1A1A1A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user['email'] ?? '',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isAdmin)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'ADMIN',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildPill(
                    isSubActive ? 'Paid' : 'Unpaid',
                    isSubActive ? const Color(0xFF25D366) : const Color(0xFFFF6B6B),
                    Icons.payment,
                  ),
                  const SizedBox(width: 8),
                  _buildPill(
                    isConnected ? 'Connected' : 'Disconnected',
                    isConnected ? const Color(0xFF25D366) : const Color(0xFFFF6B6B),
                    Icons.phone_android,
                  ),
                  const SizedBox(width: 8),
                  _buildPill(
                    isPhoneVerified ? 'Verified' : 'Not Verified',
                    isPhoneVerified ? const Color(0xFF25D366) : const Color(0xFFFFA500),
                    Icons.phone,
                  ),
                  const SizedBox(width: 8),
                  _buildPill(
                    isPaymentConnected ? 'Meta Pay' : 'No Meta Pay',
                    isPaymentConnected ? const Color(0xFF25D366) : const Color(0xFFFFA500),
                    Icons.credit_card,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Joined: ${_formatDate(user['created_at'])}',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                  if (subscription['expires_at'] != null)
                    Text(
                      'Expires: ${_formatDate(subscription['expires_at'])}',
                      style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPill(String label, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  void _showUserDetails(String userId) {
    showDialog(
      context: context,
      builder: (ctx) => _UserDetailsDialog(api: widget.api, userId: userId),
    );
  }
}

class _UserDetailsDialog extends StatefulWidget {
  final ApiService api;
  final String userId;

  const _UserDetailsDialog({required this.api, required this.userId});

  @override
  State<_UserDetailsDialog> createState() => _UserDetailsDialogState();
}

class _UserDetailsDialogState extends State<_UserDetailsDialog> {
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
    return AlertDialog(
      title: const Text('User Details'),
      content: SizedBox(
        width: double.maxFinite,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF075E54)))
            : _error != null
                ? Text(_error!)
                : _user == null
                    ? const Text('User not found')
                    : SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildDetailRow('Name', _user!['full_name'] ?? '-'),
                            _buildDetailRow('Email', _user!['email'] ?? '-'),
                            _buildDetailRow('Role', _user!['role'] ?? 'user'),
                            _buildDetailRow('Joined', _formatDate(_user!['created_at'])),
                            const Divider(height: 24),
                            const Text(
                              'Subscription',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'Status',
                              (_user!['subscription']?['active'] == true) ? 'Active' : 'Inactive',
                            ),
                            _buildDetailRow(
                              'Expires',
                              _formatDate(_user!['subscription']?['expires_at']),
                            ),
                            const Divider(height: 24),
                            const Text(
                              'WhatsApp',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'Connected',
                              (_user!['whatsapp']?['connected'] == true) ? 'Yes' : 'No',
                            ),
                            _buildDetailRow(
                              'Status',
                              _user!['whatsapp']?['status'] ?? 'Not configured',
                            ),
                            _buildDetailRow(
                              'Phone Number',
                              _user!['whatsapp']?['phone_number'] ?? '-',
                            ),
                            _buildDetailRow(
                              'Business Name',
                              _user!['whatsapp']?['business_name'] ?? '-',
                            ),
                            _buildDetailRow(
                              'Phone Verified',
                              (_user!['whatsapp']?['phone_verified'] == true) ? 'Yes' : 'No',
                            ),
                            _buildDetailRow(
                              'Meta Payment',
                              (_user!['whatsapp']?['payment_method_connected'] == true) ? 'Connected' : 'Not connected',
                            ),
                            _buildDetailRow(
                              'Quality Rating',
                              _user!['whatsapp']?['quality_rating'] ?? '-',
                            ),
                            const Divider(height: 24),
                            const Text(
                              'Counts',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            _buildDetailRow(
                              'Contacts',
                              (_user!['counts']?['contacts'] ?? 0).toString(),
                            ),
                            _buildDetailRow(
                              'Support Chats',
                              (_user!['counts']?['support_conversations'] ?? 0).toString(),
                            ),
                          ],
                        ),
                      ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
