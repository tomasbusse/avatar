"""PaddleOCR processor for scanned PDFs and images."""

import logging
from typing import List, Optional, Tuple
from pathlib import Path

logger = logging.getLogger("paddle-ocr")


class PaddleOCRProcessor:
    """
    OCR processor using PaddleOCR for German and English text extraction.

    Features:
    - 50-200ms per page (GPU) / 200-500ms (CPU)
    - German + English language support
    - High accuracy for printed text
    - Layout analysis for structured documents
    """

    def __init__(
        self,
        use_gpu: bool = False,
        lang: str = "en",  # 'en', 'german', or 'multilingual'
    ):
        """
        Initialize PaddleOCR.

        Args:
            use_gpu: Whether to use GPU acceleration
            lang: Language code ('en', 'german', 'multilingual')
        """
        self.use_gpu = use_gpu
        self.lang = lang
        self._ocr = None
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize PaddleOCR model (lazy loading)."""
        if self._initialized:
            return True

        try:
            from paddleocr import PaddleOCR

            # Map language codes
            lang_map = {
                "en": "en",
                "english": "en",
                "de": "german",
                "german": "german",
                "multilingual": "multilingual",
            }
            ocr_lang = lang_map.get(self.lang, "en")

            self._ocr = PaddleOCR(
                use_angle_cls=True,  # Detect text angle
                lang=ocr_lang,
                use_gpu=self.use_gpu,
                show_log=False,  # Reduce logging noise
            )
            self._initialized = True
            logger.info(f"PaddleOCR initialized (lang={ocr_lang}, gpu={self.use_gpu})")
            return True

        except ImportError:
            logger.error("PaddleOCR not installed. Run: pip install paddleocr paddlepaddle")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            return False

    def ocr_image(self, image_path: str) -> Tuple[str, float]:
        """
        Extract text from a single image.

        Args:
            image_path: Path to the image file

        Returns:
            Tuple of (extracted_text, average_confidence)
        """
        if not self._initialized:
            self.initialize()

        if not self._ocr:
            return "", 0.0

        try:
            result = self._ocr.ocr(image_path, cls=True)

            if not result or not result[0]:
                return "", 0.0

            # Extract text and confidence
            texts = []
            confidences = []

            for line in result[0]:
                if line and len(line) >= 2:
                    text, confidence = line[1]
                    texts.append(text)
                    confidences.append(confidence)

            full_text = "\n".join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            return full_text, avg_confidence

        except Exception as e:
            logger.error(f"OCR error on {image_path}: {e}")
            return "", 0.0

    def ocr_pdf(self, pdf_path: str, dpi: int = 200) -> List[Tuple[str, float]]:
        """
        Extract text from all pages of a PDF.

        Args:
            pdf_path: Path to the PDF file
            dpi: Resolution for PDF rendering

        Returns:
            List of (page_text, confidence) tuples
        """
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(pdf_path)
            results = []

            for page_num, page in enumerate(doc):
                # Render page to image
                mat = fitz.Matrix(dpi / 72, dpi / 72)
                pix = page.get_pixmap(matrix=mat)

                # Save to temp file (PaddleOCR needs file path)
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    pix.save(tmp.name)
                    text, confidence = self.ocr_image(tmp.name)
                    results.append((text, confidence))

                    # Clean up temp file
                    Path(tmp.name).unlink()

                logger.debug(f"OCR page {page_num + 1}/{len(doc)}, confidence={confidence:.2f}")

            doc.close()
            return results

        except ImportError:
            logger.error("PyMuPDF not installed. Run: pip install pymupdf")
            return []
        except Exception as e:
            logger.error(f"PDF OCR error on {pdf_path}: {e}")
            return []

    def ocr_pdf_to_text(self, pdf_path: str) -> str:
        """
        Extract all text from a PDF as a single string.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            Full extracted text
        """
        page_results = self.ocr_pdf(pdf_path)
        return "\n\n".join([text for text, _ in page_results])

    def needs_ocr(self, pdf_path: str) -> bool:
        """
        Check if a PDF needs OCR (is scanned/image-based).

        Args:
            pdf_path: Path to the PDF file

        Returns:
            True if PDF is scanned and needs OCR
        """
        try:
            import fitz

            doc = fitz.open(pdf_path)

            # Check first few pages for text
            text_found = False
            for page in doc[:min(3, len(doc))]:
                text = page.get_text()
                if text.strip():
                    text_found = True
                    break

            doc.close()

            # If no text found, it's likely a scanned PDF
            return not text_found

        except Exception as e:
            logger.error(f"Error checking PDF: {e}")
            return True  # Default to OCR if check fails
