"""
OCR Server - Lightweight FastAPI server for document OCR processing.
Runs alongside the LiveKit agent to provide OCR capabilities.

Start with: uvicorn ocr_server:app --port 8765
"""

import os
import tempfile
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import httpx

from src.ocr import DocumentProcessor, PaddleOCRProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr-server")

app = FastAPI(title="Beethoven OCR Server", version="1.0.0")

# Allow CORS from Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processor (lazy load OCR models)
processor: Optional[DocumentProcessor] = None


def get_processor() -> DocumentProcessor:
    global processor
    if processor is None:
        processor = DocumentProcessor(use_gpu=False, lang="multilingual")
    return processor


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "ocr-server"}


@app.post("/ocr/file")
async def ocr_file(
    file: UploadFile = File(...),
    file_type: str = Form(default="auto"),
):
    """
    Process an uploaded file with OCR.

    Args:
        file: The uploaded file
        file_type: Optional hint (pdf, image, auto)

    Returns:
        Extracted text and metadata
    """
    try:
        proc = get_processor()

        # Save to temp file
        suffix = os.path.splitext(file.filename or "")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Extract text
            text = proc.extract_text(tmp_path, file.content_type)

            # Get word count
            word_count = len(text.split()) if text else 0

            return {
                "success": True,
                "text": text,
                "wordCount": word_count,
                "fileName": file.filename,
                "usedOcr": word_count > 0 and len(content) > 1000,  # Heuristic
            }
        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ocr/url")
async def ocr_url(
    url: str = Form(...),
    file_type: str = Form(default="auto"),
):
    """
    Process a file from URL with OCR.

    Args:
        url: URL to download the file from
        file_type: Optional hint (pdf, image, auto)

    Returns:
        Extracted text and metadata
    """
    try:
        proc = get_processor()

        # Download file
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            content = response.content

        # Determine extension from URL or content-type
        content_type = response.headers.get("content-type", "")
        if "pdf" in content_type:
            suffix = ".pdf"
        elif "image" in content_type:
            suffix = ".png"
        else:
            suffix = ".pdf"

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Extract text
            text = proc.extract_text(tmp_path, content_type)
            word_count = len(text.split()) if text else 0

            return {
                "success": True,
                "text": text,
                "wordCount": word_count,
                "usedOcr": word_count > 0,
            }
        finally:
            os.unlink(tmp_path)

    except httpx.HTTPError as e:
        logger.error(f"Download error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download: {e}")
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ocr/check-needs-ocr")
async def check_needs_ocr(
    url: str = Form(...),
):
    """
    Check if a PDF needs OCR (is scanned/image-based).

    Args:
        url: URL to the PDF file

    Returns:
        Whether OCR is needed
    """
    try:
        # Download file
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            content = response.content

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            ocr = PaddleOCRProcessor()
            needs_ocr = ocr.needs_ocr(tmp_path)

            return {
                "needsOcr": needs_ocr,
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        logger.error(f"Check error: {e}")
        # Default to needing OCR if check fails
        return {"needsOcr": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
