<?php
$apiKey = "b70016995734bb83d88fb0a4981787c8";

$url = "https://gnews.io/api/v4/search?q=visa%20immigration%20travel&lang=en&max=15&apikey=$apiKey";

$response = file_get_contents($url);

if ($response === FALSE) {
    die("Error fetching news");
}

$data = json_decode($response, true);

if (!isset($data['articles'])) {
    die("Invalid API response");
}

/* ✅ Strong include keywords (must match) */
$include = [
    "visa",
    "immigration",
    "visa policy",
    "travel visa",
    "schengen",
    "entry rules",
    "border control"
];

/* ❌ Strong exclude keywords (remove junk) */
$exclude = [
    "credit card",
    "visa card",
    "debit card",
    "disney",
    "gift card",
    "e-bike",
    "crime",
    "arrested",
    "police",
    "protest",
    "trump gold card",
    "bank",
    "payment",
    "finance"
];

?>

<!DOCTYPE html>
<html>
<head>
    <title>Visa News</title>
    <style>
        body { font-family: Arial; padding: 20px; background:#f5f5f5; }
        .card { background:#fff; padding:15px; margin-bottom:15px; border-radius:6px; }
    </style>
</head>
<body>

<h2>Visa & Immigration News</h2>

<?php
$found = false;

foreach ($data['articles'] as $article) {

    $text = strtolower($article['title'] . " " . ($article['description'] ?? ""));

    // ❌ Exclude junk first
    foreach ($exclude as $bad) {
        if (strpos($text, $bad) !== false) {
            continue 2; // skip this article
        }
    }

    // ✅ Include only relevant
    $isRelevant = false;
    foreach ($include as $good) {
        if (strpos($text, $good) !== false) {
            $isRelevant = true;
            break;
        }
    }

    if (!$isRelevant) continue;

    $found = true;

    echo "<div class='card'>";
    echo "<h3>" . htmlspecialchars($article['title']) . "</h3>";
    echo "<p>" . htmlspecialchars($article['description'] ?? "") . "</p>";
    echo "<a href='" . htmlspecialchars($article['url']) . "' target='_blank'>Read Full News</a>";
    echo "</div>";
}

if (!$found) {
    echo "<p>No highly relevant visa news found. Try again later.</p>";
}
?>

</body>
</html>