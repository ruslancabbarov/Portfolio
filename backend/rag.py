import json
import os
import google.generativeai as genai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Gemini API konfiqurasiyası (Render-də GEMINI_API_KEY dəyişəni yoxdursa OPENAI_API_KEY və ya sistem key-dən oxuyur)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# profile.json faylını yükləyirik
PROFILE_PATH = os.path.join(os.path.dirname(__file__), "profile.json")

def load_profile():
    if os.path.exists(PROFILE_PATH):
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def get_rag_response(user_query: str) -> str:
    profile_data = load_profile()
    context_str = json.dumps(profile_data, ensure_ascii=False, indent=2)
    
    # Əgər Gemini API Key mövcuddursa, Gemini modeli ilə cavab generasiya edirik
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
Sən Ruslan Cabbarovun portfolioları üçün cavab verən AI assistentsən.
İstifadəçinin sualına YALNIZ aşağıda təqdim olunan şəxsi MƏLUMAT KONTEKSTİ əsasında dəqiq və peşəkar cavab ver.
Kontekstdə olmayan məlumatlar haqqında soruşularsa, nəzakətlə yalnız Ruslanın portfolio məlumatları üzrə cavab verə bildiyini qeyd et.

MƏLUMAT KONTEKSTİ:
{context_str}

İSTİFADƏÇİ SUALI:
{user_query}
"""
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini API Error: {e}")

    # Ehtiyat variant (Fallback): TF-IDF vasitəsilə sadə kontekst axtarışı
    documents = [f"{k}: {v}" for k, v in profile_data.items()]
    if not documents:
        return "Məlumat tapılmadı."
        
    vectorizer = TfidfVectorizer().fit_transform(documents + [user_query])
    vectors = vectorizer.toarray()
    
    cosine_sim = cosine_similarity([vectors[-1]], vectors[:-1])[0]
    best_idx = cosine_sim.argmax()
    
    if cosine_sim[best_idx] > 0.1:
        return f"Ruslan Cabbarov haqqında: {documents[best_idx]}"
    
    return "Salam! Mən Ruslan Cabbarovun AI assistentiyəm. Ruslanın təhsili, layihələri, Data Science və ML təcrübəsi barədə soruşa bilərsiniz."