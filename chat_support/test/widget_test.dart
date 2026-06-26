import 'package:flutter_test/flutter_test.dart';
import 'package:chat_support/main.dart';

void main() {
  testWidgets('App builds without error', (WidgetTester tester) async {
    await tester.pumpWidget(const ChatSupportApp());
    expect(find.byType(ChatSupportApp), findsOneWidget);
  });
}
