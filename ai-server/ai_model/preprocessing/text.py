PAD_TOKEN = "<pad>"
UNKNOWN_TOKEN = "<unk>"

SPECIAL_TOKENS = [PAD_TOKEN, UNKNOWN_TOKEN]
EXTRA_CHARS = list(
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "0123456789"
    " .,!?~'-_:;()[]{}\"/\n"
)
HANGUL_CHARS = [chr(code) for code in range(ord("가"), ord("힣") + 1)]

VOCAB = SPECIAL_TOKENS + EXTRA_CHARS + HANGUL_CHARS
TOKEN_TO_ID = {token: index for index, token in enumerate(VOCAB)}
ID_TO_TOKEN = {index: token for token, index in TOKEN_TO_ID.items()}

PAD_TOKEN_ID = TOKEN_TO_ID[PAD_TOKEN]
UNKNOWN_TOKEN_ID = TOKEN_TO_ID[UNKNOWN_TOKEN]
VOCAB_SIZE = len(VOCAB)


def text_to_sequence(text: str) -> list[int]:
    return [TOKEN_TO_ID.get(char, UNKNOWN_TOKEN_ID) for char in text]


def sequence_to_text(sequence: list[int]) -> str:
    chars = []

    for token_id in sequence:
        token = ID_TO_TOKEN.get(int(token_id), UNKNOWN_TOKEN)
        if token in SPECIAL_TOKENS:
            continue
        chars.append(token)

    return "".join(chars)
