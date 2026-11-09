import json
import os
import urllib.request
from pathlib import Path

from google import genai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_PATH = Path(__file__).parent / "data" / "profile.json"

MIN_SCORE = 0.12  # Bu həddən aşağı = "məlumat yoxdur"
TOP_K = 2

GITHUB_USER = os.getenv("GITHUB_USER", "ruslancabbarov")
GITHUB_TOPIC = "portfolio"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6Ihqe4O3LXSCdqlKHtum8TCpH2e_gxXcVp2ERKOqYlj3g")

def load_github_chunks():
    """GitHub-da 'portfolio' topic-i olan public repoları chunk-a çevirir."""
    url = f"https://api.github.com/users/{GITHUB_USER}/repos?per_page=100&sort=updated"
    headers = {"User-Agent": "portfolio-rag"}
    token = os.getenv("GITHUB_TOKEN")  # İxtiyari
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as r:
            repos = json.load(r)
    except Exception:
        return []  # GitHub əlçatmazdırsa, yalnız JSON ilə işləyir

    chunks = []
    for r in repos:
        if r.get("fork") or r.get("archived"):
            continue
        if GITHUB_TOPIC not in r.get("topics", []):
            continue
        lang = r.get("language") or "n/a"
        topics = " ".join(r.get("topics", []))
        chunks.append(
            {
                "id": f"gh_{r['name']}",
                "title": f"GitHub project: {r['name']}",
                "keywords": f"project layihə github {r['name']} {topics} {lang}",
                "text": (
                    f"{r['name']}: {r.get('description') or 'No description provided.'} "
                    f"Main language: {lang}. Repository: {r['html_url']}"
                ),
            }
        )
    return chunks


class PortfolioRAG:
    def __init__(self, path: Path = DATA_PATH):
        # Local JSON chunk-ları ilə GitHub repolarını birləşdiririk
        with open(path, encoding="utf-8") as f:
            self.chunks = json.load(f)["chunks"] + load_github_chunks()

        self.corpus = [
            f"{c['title']} {c['keywords']} {c['text']}" for c in self.chunks
        ]
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb", ngram_range=(3, 5), lowercase=True
        )
        self.matrix = self.vectorizer.fit_transform(self.corpus)

        # Gemini Client-i təyin edirik
        self.ai_client = genai.Client(api_key=GEMINI_API_KEY)

    def answer(self, question: str) -> dict:
        # 1. Retrieval: JSON və GitHub-dan ən uyğun 2 mətni tapırıq
        q_vec = self.vectorizer.transform([question])
        scores = cosine_similarity(q_vec, self.matrix).ravel()
        ranked = scores.argsort()[::-1][:TOP_K]

        best_score = float(scores[ranked[0]])

        if best_score < MIN_SCORE:
            context = "Bu mövzuda verilən rəsmi baza daxilində məlumat yoxdur."
            sources = []
        else:
            picked = [
                i for i in ranked if scores[i] >= max(MIN_SCORE, best_score * 0.6)
            ]
            context = "\n\n".join(self.chunks[i]["text"] for i in picked)
            sources = [self.chunks[i]["title"] for i in picked]

        # 2. Generation: RuslanAI System Prompt
        system_prompt = f"""
Sənin adın RuslanAI-dır. Sən Data Scientist və Model Validation mütəxəssisi Ruslan Cabbarovun şəxsi AI assistentisən.
Sənin vəzifən istifadəçilərin suallarına Ruslanın adından samimi, peşəkar və dəqiq cavab verməkdir.

QAYDALAR:
1. YALNIZ verilən Kontekst daxilindəki faktlara əsaslan. Kontekstdə olmayan məlumatı uydurma.
2. Əgər kontekstdə sualın cavabı yoxdursa, nəzakətlə bildir ki: "Mən Ruslanın assistentiyəm, lakin bu haqda məndə dəqiq məlumat yoxdur. Ruslanla birbaşa LinkedIn və ya Email vasitəsilə əlaqə saxlaya bilərsiniz."
3. İstifadəçi hansı dildə (Azərbaycan, İngilis və ya Rus) sual verərsə, həmin dildə cavab ver.

KONTEKST:
{context}
"""

        try:
            response = self.ai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f"{system_prompt}\n\nİstifadəçinin Sualı: {question}",
            )
            ai_answer = response.text
        except Exception as e:
            # API xətası olarsa (məsələn internet olmasa) fallback oxşar mətni qaytarır
            ai_answer = context if sources else "Xəta baş verdi, zəhmət olmasa yenidən cəhd edin."

        return {
            "answer": ai_answer,
            "sources": sources,
            "score": round(best_score, 3),
        }