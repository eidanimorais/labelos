from bot_telegram_rules_gemini import parse_release_rules

test_messages = [
    "Artista: Lil Chainz\nMúsica: Coração Vermelho\nISRC: BR-XXX-23-00001\nData: 23/02/2026",
    "Lil Chainz - Coração Vermelho - 23/02/2026\nISRC: BR-ISRC-99",
    "Artista: Test\nMusica: Test\n20/10/2025"
]

for msg in test_messages:
    result = parse_release_rules(msg)
    print(f"--- TEST ---\nMsg: {msg}\nResult: {result}\n")
