import os
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

SUPPORTED_LANGUAGES = ["English", "Spanish", "French", "Arabic", "Hindi", "Portuguese", "German", "Japanese"]

TRANSLATION_DICTIONARY = {
    "i want a coffee": {
        "Spanish": "Quiero un caf\u00e9.",
        "French": "Je veux un caf\u00e9.",
        "Arabic": "\u0623\u0631\u064a\u062f \u0642\u0647\u0648\u0629.",
        "Hindi": "\u092e\u0941\u091d\u0947 \u0915\u0949\u092b\u0940 \u091a\u093e\u0939\u093f\u090f\u0964",
        "Portuguese": "Eu quero um caf\u00e9.",
        "German": "Ich m\u00f6chte einen Kaffee.",
        "Japanese": "\u30b3\u30fc\u30d2\u30fc\u3092\u304f\u3060\u3055\u3044\u3002",
        "English": "I want a coffee."
    },
    "where is gate a?": {
        "Spanish": "\u00bfD\u00f3nde est\u00e1 la puerta A?",
        "French": "O\u00f9 se trouve la porte A?",
        "Arabic": "\u0623\u064a\u0646 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0623\u061f",
        "Hindi": "\u0917\u0947\u091f \u090f \u0915\u0939\u093e\u0901 \u0939\u0948?",
        "Portuguese": "Onde fica o port\u00e3o A?",
        "German": "Wo ist Tor A?",
        "Japanese": "\u30b2\u30fc\u30c8A\u306f\u3069\u3053\u3067\u3059\u304b\uff1f",
        "English": "Where is Gate A?"
    },
    "how do i get emergency support?": {
        "Spanish": "\u00bfC\u00f3mo obtengo apoyo de emergencia?",
        "French": "Comment obtenir une assistance d'urgence?",
        "Arabic": "\u0643\u064a\u0641 \u0623\u062d\u0635\u0644 \u0639\u0644\u064a \u062f\u0639\u0645 \u0627\u0644\u0637\u0648\u0627\u0631\u0626\u061f",
        "Hindi": "\u092e\u0941\u091d\u0947 \u0906\u092a\u093e\u0924\u0915\u093e\u0932\u0940\u0928 \u0938\u0939\u093e\u092f\u0924\u093e \u0915\u0948\u0938\u0947 \u092e\u093f\u0932\u0947\u0917\u0940?",
        "Portuguese": "Como posso obter apoio de emerg\u00eancia?",
        "German": "Wie erhalte ich Notfallunterst\u00fctzung?",
        "Japanese": "\u7dca\u6025\u30b5\u30dd\u30fc\u30c8\u3092\u53d7\u3051\u308b\u306b\u306f\u3069\u3046\u3059\u308c\u3070\u3088\u3044\u3067\u3059\u304b\uff1f",
        "English": "How do I get emergency support?"
    },
    "are there halal food options?": {
        "Spanish": "\u00bfHay opciones de comida halal?",
        "French": "Y a-t-il des options de nourriture halal?",
        "Arabic": "\u0647\u0644 \u0647\u0646\u0627\u0643 \u062e\u064a\u0627\u0631\u0627\u062a \u0637\u0639\u0627\u0645 \u062d\u0644\u0627\u0644\u061f",
        "Hindi": "\u0915\u094d\u092f\u093e \u092f\u0939\u093e\u0901 \u0939\u0932\u093e\u0932 \u092d\u094b\u091c\u0928 \u0915\u0947 \u0935\u093f\u0915\u0932\u094d\u092a \u0939\u0948\u0902?",
        "Portuguese": "Existem op\u00e7\u00f5es de comida halal?",
        "German": "Gibt es Halal-Speisen?",
        "Japanese": "\u30cf\u30e9\u30eb\u30d5\u30fc\u30c9\u306e\u9078\u629e\u80a2\u306f\u3042\u308a\u307e\u3059\u304b\uff1f",
        "English": "Are there halal food options?"
    },
    "welcome to the stadium!": {
        "Spanish": "\u00a1Bienvenido al estadio!",
        "French": "Bienvenue au stade!",
        "Arabic": "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643\u0645 \u0641\u064a \u0627\u0644\u0645\u0644\u0639\u0628!",
        "Hindi": "\u0938\u094d\u091f\u0947\u0921\u093f\u092f\u092e \u092e\u0947\u0902 \u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948!",
        "Portuguese": "Bem-vindo ao est\u00e1dio!",
        "German": "Willkommen im Stadion!",
        "Japanese": "\u30b9\u30bf\u30b8\u30a2\u30e0\u3078\u3088\u3046\u3053\uff01",
        "English": "Welcome to the stadium!"
    },
    "welcome to the stadium. enjoy the match!": {
        "Spanish": "\u00a1Bienvenido al estadio! \u00a1Disfruta del partido!",
        "French": "Bienvenue au stade! Bon match!",
        "Arabic": "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643\u0645 \u0641\u064a \u0627\u0644\u0645\u0644\u0639\u0628! \u0627\u0633\u062a\u0645\u062a\u0639\u0648\u0627 \u0628\u0627\u0644\u0645\u0628\u0627\u0631\u0627\u0629!",
        "Hindi": "\u0938\u094d\u091f\u0947\u0921\u093f\u092f\u092e \u092e\u0947\u0902 \u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948! \u092e\u0948\u091a \u0915\u093e \u0906\u0928\u0902\u0926 \u0932\u094d\u0902!",
        "Portuguese": "Bem-vindo ao est\u00e1dio! Aproveite o jogo!",
        "German": "Willkommen im Stadion! Genie\u00dfen Sie das Spiel!",
        "Japanese": "\u30b9\u30bf\u30b8\u30a2\u30e0\u3078\u3088\u3046\u3053\uff01\u8a66\u5408\u3092\u304a\u697d\u3057\u307f\u304f\u3060\u3055\u3044\uff01",
        "English": "Welcome to the stadium. Enjoy the match!"
    },
    "please evacuate via the nearest exit.": {
        "Spanish": "Por favor, evac\u00fae por la salida m\u00e1s cercana.",
        "French": "Veuillez \u00e9vacuer par la sortie la plus proche.",
        "Arabic": "\u064a\u0631\u062c\u0649 \u0627\u0644\u0625\u062e\u0644\u0627\u0621 \u0639\u0628\u0631 \u0623\u0642\u0631\u0628 \u0645\u062e\u0631\u062c.",
        "Hindi": "\u0915\u0943\u092a\u092f\u093e \u0928\u093f\u0915\u091f\u0924\u092e \u0928\u093f\u0915\u093e\u0938 \u0938\u0947 \u092c\u093e\u0939\u0930 \u0928\u093f\u0915\u0932\u0947\u0902\u0964",
        "Portuguese": "Por favor, evacue pela sa\u00edda mais pr\u00f3xima.",
        "German": "Bitte \u00fcber den n\u00e4chstgelegenen Ausgang evakuieren.",
        "Japanese": "\u6700\u5bc4\u308a\u306e\u51fa\u53e3\u304b\u3089\u907f\u96e3\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
        "English": "Please evacuate via the nearest exit."
    },
    "please remain calm.": {
        "Spanish": "Por favor, mantenga la calma.",
        "French": "S'il vous pla\u00eet, restez calme.",
        "Arabic": "\u064a\u0631\u062c\u0649 \u0627\u0644\u0628\u0642\u0627\u0621 \u0647\u0627\u0626\u062f\u0627\u064b.",
        "Hindi": "\u0915\u0943\u092a\u092f\u093e \u0936\u093e\u0902\u0924 \u0930\u0939\u0947\u0902\u0964",
        "Portuguese": "Por favor, acalme-se.",
        "German": "Bitte Ruhe bewahren.",
        "Japanese": "\u843d\u3061\u7740\u3044\u3066\u304f\u3060\u3055\u3044\u3002",
        "English": "Please remain calm."
    },
    "the match starts in 10 minutes, please take your seats.": {
        "Spanish": "El partido comienza en 10 minutos, por favor tomen sus asientos.",
        "French": "Le match commence dans 10 minutes, veuillez prendre place.",
        "Arabic": "\u062a\u0628\u062f\u0623 \u0627\u0644\u0645\u0628\u0627\u0631\u0627\u0629 \u062e\u0644\u0627\u0644 10 \u062f\u0642\u0627\u0626\u0642\u060c \u064a\u0631\u062c\u0649 \u0627\u062a\u062e\u0627\u0630 \u0645\u0642\u0627\u0639\u062f\u0643\u0645.",
        "Hindi": "\u092e\u0948\u091a 10 \u092e\u093f\u0928\u091f \u092e\u0947\u0902 \u0936\u094d\u0930\u0942 \u0939\u094c\u0917\u093e, \u0915\u0943\u092a\u092f\u093e \u0905\u092a\u0928\u093e \u0938\u094d\u0925\u093e\u0928 \u0917\u094d\u0930\u0939\u0923 \u0915\u0930\u0947\u0902\u0964",
        "Portuguese": "O jogo come\u00e7a em 10 minutos, por favor sentem-se.",
        "German": "Das Spiel beginnt in 10 Minuten, bitte nehmen Sie Ihre Pl\u00e4tze ein.",
        "Japanese": "\u8a66\u5408\u306f10\u5206\u5f8c\u306b\u59cb\u307e\u308a\u307e\u3059\u3002\u5e2d\u306b\u304a\u7740\u304d\u304f\u3060\u3055\u3044\u3002",
        "English": "The match starts in 10 minutes, please take your seats."
    }
}

class TranslationService:
    @staticmethod
    async def translate_text(text: str, target_language: str) -> str:
        normalized_lang = target_language.strip().capitalize()
        if normalized_lang not in SUPPORTED_LANGUAGES:
            normalized_lang = "English"

        # Check dictionary fallback (ignores punctuation/case mismatch)
        input_key = text.lower().strip().rstrip("?.!")
        for phrase, langs in TRANSLATION_DICTIONARY.items():
            if phrase.lower().strip().rstrip("?.!") == input_key:
                return langs.get(normalized_lang, text)

        # Try OpenAI translation if client is available
        if client:
            system_instruction = f"Translate the given text into standard {normalized_lang}. Output only the translation."
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": text}
                    ],
                    max_tokens=300,
                    temperature=0.1,
                    timeout=2.5
                )
                if response.choices[0].message.content:
                    return response.choices[0].message.content.strip()
            except Exception:
                pass

        # Fallback to Google Translate free API
        LANG_MAP = {
            "English": "en",
            "Spanish": "es",
            "French": "fr",
            "Arabic": "ar",
            "Hindi": "hi",
            "Portuguese": "pt",
            "German": "de",
            "Japanese": "ja"
        }
        target_code = LANG_MAP.get(normalized_lang, "en")
        
        import urllib.request
        import urllib.parse
        import json
        import asyncio
        
        try:
            encoded_text = urllib.parse.quote(text)
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_code}&dt=t&q={encoded_text}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            loop = asyncio.get_event_loop()
            def _fetch():
                with urllib.request.urlopen(req, timeout=3.0) as conn:
                    return conn.read()
            
            response_bytes = await loop.run_in_executor(None, _fetch)
            res_data = json.loads(response_bytes.decode('utf-8'))
            translated_parts = [part[0] for part in res_data[0] if part[0]]
            return "".join(translated_parts).strip()
        except Exception:
            return f"[{normalized_lang} Translation of]: '{text}'"

    @staticmethod
    async def generate_speech_mock(text: str, target_language: str) -> str:
        lang_code = target_language[:2].lower()
        return f"https://cdn.smartstadium.ai/audio/translations/{lang_code}/announcement_latest.mp3"
