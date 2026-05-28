<?php
// VoiceKhaata Group Invite Landing Page
// Upload this to your server at: growbychat.app/join/
// It will handle URLs like: https://growbychat.app/join?groupId=XXX

$groupId = $_GET['groupId'] ?? '';
$hasGroupId = !empty($groupId);

// App identifiers
$androidPackage = 'com.voicekhaata.app';
$iosAppStoreUrl = 'https://apps.apple.com/app/voicekhaata'; // Replace with actual App Store URL when available
$playStoreUrl = 'https://play.google.com/store/apps/details?id=' . $androidPackage;

// Deep link to open the app directly
$appDeepLink = 'voicekhaata://join?groupId=' . urlencode($groupId);
$intentUrl = 'intent://join?groupId=' . urlencode($groupId) . '#Intent;scheme=voicekhaata;package=' . $androidPackage . ';end';

// Rich preview meta (shown in WhatsApp/Telegram/iMessage)
$title = $hasGroupId ? 'Join my group on VoiceKhaata' : 'VoiceKhaata - Smart Expense Tracker';
$description = $hasGroupId 
    ? 'Tap to join the group and split expenses together. Make sure VoiceKhaata is installed!'
    : 'Split bills, track group expenses, and settle up with friends. All by voice.';
$imageUrl = 'https://growbychat.app/voicekhaata-og.jpg'; // Upload an OG image to your server root
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title><?php echo htmlspecialchars($title); ?></title>

    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://growbychat.app/join<?php echo $hasGroupId ? '?groupId=' . htmlspecialchars($groupId) : ''; ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($imageUrl); ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($imageUrl); ?>">

    <!-- iOS -->
    <meta name="apple-itunes-app" content="app-id=YOUR_APPLE_APP_ID, app-argument=<?php echo htmlspecialchars($appDeepLink); ?>">

    <!-- Theme -->
    <meta name="theme-color" content="#4F46E5">

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #fff;
        }
        .card {
            background: rgba(255,255,255,0.95);
            border-radius: 24px;
            padding: 40px 32px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            color: #1f2937;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        .logo {
            width: 72px;
            height: 72px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
        }
        h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; line-height: 1.3; }
        p { font-size: 15px; color: #6b7280; margin-bottom: 28px; line-height: 1.5; }
        .btn {
            display: block;
            width: 100%;
            padding: 16px 24px;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            text-decoration: none;
            margin-bottom: 12px;
            transition: transform 0.15s ease;
            border: none;
            cursor: pointer;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        .stores {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 20px;
        }
        .store-badge {
            height: 40px;
            opacity: 0.9;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hidden { display: none; }
        .muted { font-size: 13px; color: #9ca3af; margin-top: 16px; }
    </style>
</head>
<body>

    <div class="card">
        <?php if ($hasGroupId): ?>
            <div id="redirecting">
                <div class="spinner"></div>
                <h1>Opening VoiceKhaata...</h1>
                <p class="muted">If nothing happens, tap below</p>
            </div>
        <?php endif; ?>

        <div id="content" class="<?php echo $hasGroupId ? 'hidden' : ''; ?>">
            <div class="logo">💸</div>
            <h1><?php echo htmlspecialchars($title); ?></h1>
            <p><?php echo htmlspecialchars($description); ?></p>

            <?php if ($hasGroupId): ?>
                <!-- Primary: Try to open app directly -->
                <a class="btn btn-primary" id="openAppBtn" href="<?php echo htmlspecialchars($appDeepLink); ?>">
                    Open in VoiceKhaata
                </a>

                <!-- Fallback: Play Store / App Store -->
                <a class="btn btn-secondary" href="<?php echo htmlspecialchars($playStoreUrl); ?>" target="_blank">
                    Get VoiceKhaata from Play Store
                </a>
            <?php else: ?>
                <a class="btn btn-primary" href="<?php echo htmlspecialchars($playStoreUrl); ?>" target="_blank">
                    Download VoiceKhaata
                </a>
            <?php endif; ?>

            <div class="stores">
                <a href="<?php echo htmlspecialchars($playStoreUrl); ?>" target="_blank">
                    <img class="store-badge" src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play">
                </a>
            </div>
        </div>

        <div class="muted" style="margin-top: 20px;">
            <?php if ($hasGroupId): ?>
                Group ID: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;"><?php echo htmlspecialchars($groupId); ?></code>
            <?php endif; ?>
        </div>
    </div>

    <script>
        (function() {
            var groupId = <?php echo json_encode($groupId); ?>;
            var isAndroid = /Android/i.test(navigator.userAgent);
            var isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (groupId) {
                // Auto-redirect after a short delay to let OG meta tags be scraped
                setTimeout(function() {
                    var appLink = 'voicekhaata://join?groupId=' + encodeURIComponent(groupId);
                    
                    if (isAndroid) {
                        // Android intent fallback
                        window.location.href = 'intent://join?groupId=' + encodeURIComponent(groupId) + 
                            '#Intent;scheme=voicekhaata;package=com.voicekhaata.app;end';
                    } else if (isiOS) {
                        // iOS: try custom scheme, fallback to App Store after delay
                        window.location.href = appLink;
                        setTimeout(function() {
                            window.location.href = <?php echo json_encode($iosAppStoreUrl); ?>;
                        }, 2500);
                    } else {
                        // Desktop / other: just show the page
                        document.getElementById('redirecting').style.display = 'none';
                        document.getElementById('content').classList.remove('hidden');
                    }
                }, 800);
            }
        })();
    </script>

</body>
</html>
