import pytest
import asyncio
from backend.services.media_pipeline import media_pipeline

@pytest.mark.asyncio
async def test_speech_synthesis_multilingual():
    # Test English synthesis
    en_res = await media_pipeline.synthesize_speech("Newton's First Law is about inertia.", language="en")
    assert "audio_url" in en_res
    assert en_res["language"] == "en"
    assert len(en_res["viseme_timeline"]) > 0

    # Test Hindi synthesis
    hi_res = await media_pipeline.synthesize_speech("न्यूटन का पहला नियम जड़त्व के बारे में है।", language="hi")
    assert "audio_url" in hi_res
    assert hi_res["language"] == "hi"

    # Test Hinglish synthesis
    hing_res = await media_pipeline.synthesize_speech("Newton ka first law inertia ke baare mein hai.", language="hinglish")
    assert "audio_url" in hing_res
    assert hing_res["language"] == "hinglish"

def test_viseme_generation():
    visemes = media_pipeline._generate_visemes_timeline("Force equals mass times acceleration", 3.0)
    assert len(visemes) > 0
    first = visemes[0]
    assert "start" in first
    assert "viseme" in first
    assert "duration" in first
