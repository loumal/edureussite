#!/usr/bin/env python3
"""
ÉduRéussite TTS API — edge-tts bilingue FR/EN avec détection mixte
Version: 8.0.0
"""

import os
import re
import tempfile
import xml.sax.saxutils as saxutils
from typing import Optional, Literal

import edge_tts
from fastapi import FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

API_KEY = os.environ.get("TTS_API_KEY", "Edureussite_Alex_2026_Secure")

VOICES = {
    "fr": "fr-FR-DeniseNeural",
    "en": "en-US-JennyNeural",
}

# Mots anglais courants pour la détection automatique de langue
EN_MARKERS = {
    "the", "is", "are", "was", "were", "have", "has", "had", "will", "would",
    "can", "could", "should", "do", "does", "did", "be", "been", "being",
    "a", "an", "and", "or", "but", "not", "with", "for", "on", "at", "to",
    "in", "of", "it", "this", "that", "what", "how", "why", "when", "where",
    "you", "we", "they", "he", "she", "i", "my", "your", "our", "their",
    "learn", "today", "really", "amazing", "good", "great", "let", "go",
    "very", "now", "yes", "no", "ok", "okay", "hello", "hi", "please",
}

app = FastAPI(title="API Edureussite Voice", version="8.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000)
    language: Optional[str] = None   # "fr" | "en" | None (auto-détection)
    rate: str = Field(default="-8%")
    pitch: str = Field(default="+10%")
    # Champs legacy ignorés mais acceptés pour compatibilité
    speaking_rate: Optional[str] = None
    style: Optional[str] = None
    styledegree: Optional[float] = None
    volume: Optional[str] = None


def check_auth(x_api_key: Optional[str]) -> None:
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


def detect_language(text: str) -> Literal["fr", "en"]:
    """Détecte si le texte est majoritairement anglais ou français."""
    words = re.findall(r"\b\w+\b", text.lower())
    if not words:
        return "fr"
    en_count = sum(1 for w in words if w in EN_MARKERS)
    return "en" if (en_count / len(words)) > 0.35 else "fr"


def detect_sentence_language(sentence: str) -> Literal["fr", "en"]:
    """Détecte la langue d'une phrase individuelle."""
    return detect_language(sentence)


def split_sentences(text: str):
    """Découpe le texte en phrases en conservant la ponctuation."""
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def build_ssml(
    text: str,
    language: Literal["fr", "en"],
    rate: str,
    pitch: str,
) -> str:
    """
    Construit le SSML. Détecte les phrases dans la langue opposée
    et les enveloppe dans la voix appropriée pour un rendu naturel.
    """
    sentences = split_sentences(text)

    if len(sentences) <= 1:
        # Texte court : SSML simple
        content = saxutils.escape(text)
        voice = VOICES[language]
        xml_lang = "en-US" if language == "en" else "fr-FR"
        en_pitch = "+8%" if pitch == "+10%" else pitch
        effective_pitch = en_pitch if language == "en" else pitch
        return (
            f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
            f'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="{xml_lang}">'
            f'<voice name="{voice}">'
            f'<mstts:express-as style="cheerful" styledegree="1.8">'
            f'<prosody rate="{rate}" pitch="{effective_pitch}">'
            f'{content}'
            f'</prosody></mstts:express-as></voice></speak>'
        )

    # Texte multi-phrases : détection et changement de voix par phrase
    xml_lang = "en-US" if language == "en" else "fr-FR"
    primary_voice = VOICES[language]
    other_lang: Literal["fr", "en"] = "en" if language == "fr" else "fr"
    other_voice = VOICES[other_lang]
    other_xml_lang = "en-US" if other_lang == "en" else "fr-FR"

    # Pitch adapté par langue
    fr_pitch = pitch
    en_pitch = "+8%" if pitch == "+10%" else pitch

    parts = []
    for sentence in sentences:
        lang_detected = detect_sentence_language(sentence)
        content = saxutils.escape(sentence)

        if lang_detected == language:
            # Même langue que le contexte principal
            p = (lang_detected == "en" and en_pitch) or fr_pitch
            parts.append(
                f'<mstts:express-as style="cheerful" styledegree="1.8">'
                f'<prosody rate="{rate}" pitch="{p}">{content}</prosody>'
                f'</mstts:express-as>'
            )
        else:
            # Langue différente → changer de voix
            p = en_pitch if lang_detected == "en" else fr_pitch
            parts.append(
                f'<voice name="{other_voice}">'
                f'<lang xml:lang="{other_xml_lang}">'
                f'<mstts:express-as style="cheerful" styledegree="1.8">'
                f'<prosody rate="{rate}" pitch="{p}">{content}</prosody>'
                f'</mstts:express-as>'
                f'</lang></voice>'
                f'<voice name="{primary_voice}">'
            )

    # Nettoyage : retrait des balises <voice> orphelines en fin de chaîne
    inner = " ".join(parts).rstrip()
    # Fermer les voice tags ouverts non fermés
    open_count = inner.count(f'<voice name="{primary_voice}">') - inner.count('</voice>') + 1
    inner += "</voice>" * max(0, open_count - 1)

    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="{xml_lang}">'
        f'<voice name="{primary_voice}">'
        f'{inner}'
        f'</speak>'
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "8.0.0", "voices": VOICES}


@app.post("/generate")
async def generate_voice(
    body: TTSRequest,
    x_api_key: Optional[str] = Header(default=None),
):
    check_auth(x_api_key)

    # Résolution langue : champ fourni > auto-détection
    raw_lang = (body.language or "").strip().lower()
    if raw_lang in ("fr", "en"):
        language: Literal["fr", "en"] = raw_lang  # type: ignore
    else:
        language = detect_language(body.text)

    rate = body.speaking_rate or body.rate
    # Pitch par défaut selon langue si non fourni explicitement
    if body.pitch == "+10%" and language == "en":
        pitch = "+8%"
    else:
        pitch = body.pitch

    ssml_text = build_ssml(body.text.strip(), language, rate, pitch)
    voice = VOICES[language]

    async def audio_stream():
        communicate = edge_tts.Communicate(text=ssml_text, voice=voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]

    try:
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            audio_stream(),
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # workers=4 : 4 processus indépendants pour gérer les requêtes simultanées
    uvicorn.run("api_edureussite:app", host="0.0.0.0", port=8000, workers=4)
