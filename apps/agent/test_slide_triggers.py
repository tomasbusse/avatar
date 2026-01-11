#!/usr/bin/env python3
"""
Debug script to test slide command detection.
Run: python test_slide_triggers.py
"""

import re
from typing import Optional, Tuple


class SlideCommandDetector:
    """Test version of the slide command detector."""

    # Silent markers (get stripped)
    SILENT_NEXT = re.compile(r'\[NEXT\]|\[SLIDE:NEXT\]|\[>>>\]', re.IGNORECASE)
    SILENT_PREV = re.compile(r'\[PREV\]|\[BACK\]|\[SLIDE:PREV\]|\[<<<\]', re.IGNORECASE)
    SILENT_GOTO = re.compile(r'\[SLIDE:(\d+)\]|\[GOTO:(\d+)\]', re.IGNORECASE)

    # Natural language (not stripped)
    NATURAL_NEXT = re.compile(
        r"\b(next|nächste|nächsten)\s*(slide|folie)\b|"
        r"\blet'?s\s+(move|go|continue)\s+(on|forward|to the next)\b|"
        r"\bmoving\s+(on|forward)\b",
        re.IGNORECASE
    )
    NATURAL_PREV = re.compile(
        r"\b(previous|vorherige|back)\s*(slide|folie)\b|"
        r"\bgo\s*back\b|\bzurück\b",
        re.IGNORECASE
    )
    NATURAL_GOTO = re.compile(
        r"\b(slide|folie)\s*(number|nummer)?\s*#?(\d+)\b",
        re.IGNORECASE
    )

    def detect_and_strip(self, text: str) -> Tuple[str, Optional[Tuple[str, Optional[int]]]]:
        command = None

        # Check goto first
        goto_match = self.SILENT_GOTO.search(text)
        if goto_match:
            slide_num = goto_match.group(1) or goto_match.group(2)
            if slide_num:
                command = ("goto", int(slide_num))
        elif self.SILENT_NEXT.search(text):
            command = ("next", None)
        elif self.SILENT_PREV.search(text):
            command = ("prev", None)

        # Strip all markers
        cleaned = self.SILENT_NEXT.sub('', text)
        cleaned = self.SILENT_PREV.sub('', cleaned)
        cleaned = self.SILENT_GOTO.sub('', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        return (cleaned, command)

    def detect_natural(self, text: str) -> Optional[Tuple[str, Optional[int]]]:
        # Check goto first
        goto_match = self.NATURAL_GOTO.search(text)
        if goto_match:
            for g in goto_match.groups():
                if g and g.isdigit():
                    return ("goto", int(g))

        if self.NATURAL_NEXT.search(text):
            return ("next", None)

        if self.NATURAL_PREV.search(text):
            return ("prev", None)

        return None


def test_detector():
    detector = SlideCommandDetector()

    print("=" * 70)
    print("SLIDE COMMAND DETECTOR TEST")
    print("=" * 70)
    print()

    # Test silent markers
    print("--- SILENT MARKERS (stripped from speech) ---")
    silent_tests = [
        ("Let's look at this [NEXT] as you can see", ("next", None), "Let's look at this as you can see"),
        ("Now [SLIDE:3] here we have the grammar rules", ("goto", 3), "Now here we have the grammar rules"),
        ("[PREV] let me explain again", ("prev", None), "let me explain again"),
        ("[>>>] First, let's discuss vocabulary", ("next", None), "First, let's discuss vocabulary"),
        ("[GOTO:5] Now we're on the exercise slide", ("goto", 5), "Now we're on the exercise slide"),
    ]

    for input_text, expected_cmd, expected_cleaned in silent_tests:
        cleaned, command = detector.detect_and_strip(input_text)
        status = "✅" if command == expected_cmd and cleaned == expected_cleaned else "❌"
        print(f"{status} \"{input_text[:50]}...\"")
        print(f"   Command: {command}, Cleaned: \"{cleaned}\"")

    print()
    print("--- NATURAL LANGUAGE (spoken, not stripped) ---")
    natural_tests = [
        ("Let's move to the next slide now", ("next", None)),
        ("Can you go to slide 3 please", ("goto", 3)),
        ("Let me go back to the previous slide", ("prev", None)),
        ("Now let's continue forward", ("next", None)),
        ("Moving on to the vocabulary section", ("next", None)),
        ("Zurück zur letzten Folie", ("prev", None)),
        ("Nächste Folie bitte", ("next", None)),
        ("Folie 5 zeigt uns die Grammatik", ("goto", 5)),
        ("This is just a normal sentence", None),
    ]

    for input_text, expected_cmd in natural_tests:
        command = detector.detect_natural(input_text)
        status = "✅" if command == expected_cmd else "❌"
        print(f"{status} \"{input_text}\"")
        print(f"   Command: {command}" + (f" (expected: {expected_cmd})" if command != expected_cmd else ""))

    print()
    print("=" * 70)

    # Interactive mode
    print("\n🎤 INTERACTIVE MODE - Type phrases to test (Ctrl+C to exit):\n")
    try:
        while True:
            user_input = input("Enter text: ")
            if not user_input:
                continue

            # Test both methods
            cleaned, silent_cmd = detector.detect_and_strip(user_input)
            natural_cmd = detector.detect_natural(user_input)

            print(f"  Silent marker: {silent_cmd}")
            if user_input != cleaned:
                print(f"  Cleaned text:  \"{cleaned}\"")
            print(f"  Natural lang:  {natural_cmd}")
            print()
    except KeyboardInterrupt:
        print("\n\nDone!")


if __name__ == "__main__":
    test_detector()
