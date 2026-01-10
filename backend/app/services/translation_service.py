from google.cloud import translate

project_id = "anish-ai-planner"
location = "global"

try:
    client = translate.TranslationServiceClient()
    parent = f"projects/{project_id}/locations/{location}"
    print(" Google Translation Client initialized successfully.")
except Exception as e:
    print(f" Failed to initialize Google Translation Client: {e}")
    client = None

def translate_auto_to_english(text: str):

    if not client:
        return "en", text
    
    try:
        response = client.translate_text(
            request={
                "parent": parent,
                "contents": [text],
                "mime_type": "text/plain",
                "target_language_code": "en",
            }
        )
        translation = response.translations[0]
        return translation.detected_language_code, translation.translated_text
    except Exception as e:
        print(f" Translation error: {e}")
        return "en", text

def translate_to_language(text: str, target_language: str):
    """
    Translate text to target language
    """
    if not client or target_language == "en":
        return text
    
    try:
        response = client.translate_text(
            request={
                "parent": parent,
                "contents": [text],
                "mime_type": "text/plain",
                "target_language_code": target_language,
            }
        )
        return response.translations[0].translated_text
    except Exception as e:
        print(f" Translation error: {e}")
        return text
