"""OCR module for extracting text from scanned PDFs and images."""

from .paddle_ocr import PaddleOCRProcessor
from .processor import DocumentProcessor

__all__ = ["PaddleOCRProcessor", "DocumentProcessor"]
