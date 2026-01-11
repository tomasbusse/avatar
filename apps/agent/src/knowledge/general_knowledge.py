"""General Knowledge Base for Language Learning.

Ultra-fast lookup (<1ms) for common language learning content:
- Grammar rules that apply across all lessons
- Core vocabulary (A1-B2, ~3000 most common words)
- Common German speaker mistakes
- Idioms and expressions

This is loaded once at agent startup and kept in memory.
Use this for instant retrieval without LLM or database calls.
"""

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from difflib import SequenceMatcher

logger = logging.getLogger("beethoven-agent.general-knowledge")


@dataclass
class GrammarRule:
    """A grammar rule with examples and common errors."""
    id: str
    name: str
    category: str  # "tenses", "articles", "prepositions", "word_order", etc.
    level: str  # A1, A2, B1, B2
    explanation_en: str
    explanation_de: str
    formula: str = ""
    examples: List[Dict[str, str]] = field(default_factory=list)
    common_errors: List[Dict[str, str]] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)


@dataclass
class VocabularyEntry:
    """A vocabulary word with translations and usage."""
    term: str
    term_de: str
    definition: str
    part_of_speech: str  # noun, verb, adjective, etc.
    level: str  # A1-B2
    example_sentence: str = ""
    example_sentence_de: str = ""
    category: str = ""  # business, travel, food, etc.
    synonyms: List[str] = field(default_factory=list)


@dataclass
class CommonMistake:
    """A common mistake German speakers make in English."""
    id: str
    pattern: str  # What they say wrong
    correct: str  # What they should say
    explanation_en: str
    explanation_de: str
    frequency: str  # "very_common", "common", "occasional"
    level: str  # At which level this typically occurs


class GeneralKnowledgeBase:
    """In-memory knowledge base for ultra-fast lookups.

    Latency: <1ms for exact match, <5ms for fuzzy search

    This is the "warm cache" tier - loaded at startup from
    JSON files or Convex, kept entirely in memory.
    """

    def __init__(self):
        self._grammar_rules: Dict[str, GrammarRule] = {}
        self._grammar_by_category: Dict[str, List[GrammarRule]] = {}
        self._grammar_by_keyword: Dict[str, List[GrammarRule]] = {}

        self._vocabulary: Dict[str, VocabularyEntry] = {}  # term -> entry
        self._vocabulary_de: Dict[str, VocabularyEntry] = {}  # term_de -> entry
        self._vocabulary_by_level: Dict[str, List[VocabularyEntry]] = {}
        self._vocabulary_by_category: Dict[str, List[VocabularyEntry]] = {}

        self._mistakes: Dict[str, CommonMistake] = {}
        self._mistake_patterns: Dict[str, CommonMistake] = {}  # pattern -> mistake

        self._loaded = False

    async def load_from_convex(self, convex_client) -> None:
        """Load general knowledge from Convex database."""
        try:
            # Load grammar rules
            grammar_data = await convex_client.query(
                "knowledgeBases:getGeneralGrammarRules",
                {}
            )
            if grammar_data:
                self._load_grammar(grammar_data)

            # Load core vocabulary
            vocab_data = await convex_client.query(
                "knowledgeBases:getGeneralVocabulary",
                {"maxLevel": "B2"}  # Only load up to B2 for speed
            )
            if vocab_data:
                self._load_vocabulary(vocab_data)

            # Load common mistakes
            mistakes_data = await convex_client.query(
                "knowledgeBases:getCommonMistakes",
                {}
            )
            if mistakes_data:
                self._load_mistakes(mistakes_data)

            self._loaded = True
            logger.info(
                f"General knowledge loaded: {len(self._grammar_rules)} grammar rules, "
                f"{len(self._vocabulary)} vocab words, {len(self._mistakes)} mistake patterns"
            )
        except Exception as e:
            logger.warning(f"Failed to load general knowledge from Convex: {e}")
            # Fall back to built-in defaults
            self._load_builtin_defaults()

    def _load_builtin_defaults(self) -> None:
        """Load built-in default knowledge (fallback)."""
        # Core grammar rules every German speaker needs
        default_grammar = [
            GrammarRule(
                id="present_simple",
                name="Present Simple Tense",
                category="tenses",
                level="A1",
                explanation_en="Use for habits, facts, and regular actions. Third person singular adds -s.",
                explanation_de="Für Gewohnheiten, Fakten und regelmäßige Handlungen. 3. Person Singular bekommt -s.",
                formula="Subject + Verb (+ s for he/she/it)",
                examples=[
                    {"correct": "She works every day.", "incorrect": "She work every day."},
                    {"correct": "He plays tennis.", "incorrect": "He play tennis."},
                ],
                common_errors=[
                    {"error": "He go to work.", "correction": "He goes to work."}
                ],
                keywords=["present", "simple", "habit", "routine", "-s", "third person"],
            ),
            GrammarRule(
                id="present_continuous",
                name="Present Continuous Tense",
                category="tenses",
                level="A1",
                explanation_en="Use for actions happening right now or temporary situations.",
                explanation_de="Für Handlungen, die gerade passieren oder temporäre Situationen.",
                formula="Subject + am/is/are + Verb-ing",
                examples=[
                    {"correct": "I am working now.", "incorrect": "I work now."},
                    {"correct": "She is reading a book.", "incorrect": "She reads a book (now)."},
                ],
                keywords=["present", "continuous", "progressive", "now", "currently", "-ing"],
            ),
            GrammarRule(
                id="articles",
                name="Definite and Indefinite Articles",
                category="articles",
                level="A1",
                explanation_en="Use 'a/an' for general things, 'the' for specific things. No article for general plurals.",
                explanation_de="'a/an' für allgemeine Dinge, 'the' für spezifische Dinge. Kein Artikel für allgemeine Plurale.",
                formula="a + consonant sound, an + vowel sound, the = specific",
                examples=[
                    {"correct": "I have a dog.", "incorrect": "I have dog."},
                    {"correct": "The dog is brown.", "incorrect": "Dog is brown."},
                    {"correct": "I like music.", "incorrect": "I like the music (in general)."},
                ],
                keywords=["article", "a", "an", "the", "definite", "indefinite"],
            ),
            GrammarRule(
                id="word_order",
                name="Word Order in Questions",
                category="word_order",
                level="A2",
                explanation_en="In questions, the auxiliary verb comes before the subject. Do/Does/Did for simple tenses.",
                explanation_de="In Fragen steht das Hilfsverb vor dem Subjekt. Do/Does/Did für einfache Zeiten.",
                formula="Question word + Auxiliary + Subject + Main Verb",
                examples=[
                    {"correct": "Where do you live?", "incorrect": "Where you live?"},
                    {"correct": "What does she want?", "incorrect": "What she wants?"},
                ],
                keywords=["question", "word order", "do", "does", "did", "auxiliary"],
            ),
            GrammarRule(
                id="present_perfect",
                name="Present Perfect Tense",
                category="tenses",
                level="A2",
                explanation_en="Use for past actions with present relevance, experiences, or unfinished time periods.",
                explanation_de="Für vergangene Handlungen mit Bezug zur Gegenwart, Erfahrungen oder unabgeschlossene Zeiträume.",
                formula="Subject + have/has + Past Participle",
                examples=[
                    {"correct": "I have visited Paris.", "incorrect": "I visited Paris (for experience)."},
                    {"correct": "She has worked here for 5 years.", "incorrect": "She works here for 5 years."},
                ],
                keywords=["present perfect", "have", "has", "experience", "yet", "already", "for", "since"],
            ),
        ]

        for rule in default_grammar:
            self._add_grammar_rule(rule)

        # Common German speaker mistakes
        default_mistakes = [
            CommonMistake(
                id="become_bekommen",
                pattern="become",
                correct="get/receive",
                explanation_en="'Become' means 'werden', not 'bekommen'. Use 'get' or 'receive' for 'bekommen'.",
                explanation_de="'Become' bedeutet 'werden', nicht 'bekommen'. Benutze 'get' oder 'receive' für 'bekommen'.",
                frequency="very_common",
                level="A1",
            ),
            CommonMistake(
                id="actually_eigentlich",
                pattern="actually",
                correct="currently/at the moment",
                explanation_en="'Actually' means 'tatsächlich/eigentlich', not 'aktuell'. Use 'currently' for 'aktuell'.",
                explanation_de="'Actually' bedeutet 'tatsächlich', nicht 'aktuell'. Benutze 'currently' für 'aktuell'.",
                frequency="very_common",
                level="A2",
            ),
            CommonMistake(
                id="make_do",
                pattern="make/do",
                correct="make vs do",
                explanation_en="'Make' is for creating/producing. 'Do' is for actions/activities. 'Make a decision' but 'do homework'.",
                explanation_de="'Make' für Erschaffen. 'Do' für Tätigkeiten. 'Make a decision' aber 'do homework'.",
                frequency="common",
                level="A2",
            ),
            CommonMistake(
                id="since_for",
                pattern="since/for",
                correct="since vs for",
                explanation_en="'Since' + point in time (since Monday). 'For' + duration (for 3 days).",
                explanation_de="'Since' + Zeitpunkt (since Monday). 'For' + Dauer (for 3 days).",
                frequency="common",
                level="A2",
            ),
        ]

        for mistake in default_mistakes:
            self._add_mistake(mistake)

        self._loaded = True
        logger.info("Loaded built-in default knowledge")

    def _load_grammar(self, data: List[Dict]) -> None:
        """Load grammar rules from Convex data."""
        for item in data:
            rule = GrammarRule(
                id=item.get("id", item.get("_id", "")),
                name=item.get("name", ""),
                category=item.get("category", "general"),
                level=item.get("level", "A1"),
                explanation_en=item.get("explanationEn", item.get("explanation", "")),
                explanation_de=item.get("explanationDe", ""),
                formula=item.get("formula", ""),
                examples=item.get("examples", []),
                common_errors=item.get("commonErrors", []),
                keywords=item.get("keywords", []),
            )
            self._add_grammar_rule(rule)

    def _add_grammar_rule(self, rule: GrammarRule) -> None:
        """Add a grammar rule to the index."""
        self._grammar_rules[rule.id] = rule

        # Index by category
        if rule.category not in self._grammar_by_category:
            self._grammar_by_category[rule.category] = []
        self._grammar_by_category[rule.category].append(rule)

        # Index by keywords
        for keyword in rule.keywords:
            kw_lower = keyword.lower()
            if kw_lower not in self._grammar_by_keyword:
                self._grammar_by_keyword[kw_lower] = []
            self._grammar_by_keyword[kw_lower].append(rule)

    def _load_vocabulary(self, data: List[Dict]) -> None:
        """Load vocabulary from Convex data."""
        for item in data:
            entry = VocabularyEntry(
                term=item.get("term", ""),
                term_de=item.get("termDe", ""),
                definition=item.get("definition", ""),
                part_of_speech=item.get("partOfSpeech", ""),
                level=item.get("level", "A1"),
                example_sentence=item.get("exampleSentence", ""),
                example_sentence_de=item.get("exampleSentenceDe", ""),
                category=item.get("category", ""),
                synonyms=item.get("synonyms", []),
            )
            self._add_vocabulary(entry)

    def _add_vocabulary(self, entry: VocabularyEntry) -> None:
        """Add a vocabulary entry to the index."""
        self._vocabulary[entry.term.lower()] = entry
        if entry.term_de:
            self._vocabulary_de[entry.term_de.lower()] = entry

        # Index by level
        if entry.level not in self._vocabulary_by_level:
            self._vocabulary_by_level[entry.level] = []
        self._vocabulary_by_level[entry.level].append(entry)

        # Index by category
        if entry.category:
            if entry.category not in self._vocabulary_by_category:
                self._vocabulary_by_category[entry.category] = []
            self._vocabulary_by_category[entry.category].append(entry)

    def _load_mistakes(self, data: List[Dict]) -> None:
        """Load common mistakes from Convex data."""
        for item in data:
            mistake = CommonMistake(
                id=item.get("id", item.get("_id", "")),
                pattern=item.get("pattern", ""),
                correct=item.get("correct", ""),
                explanation_en=item.get("explanationEn", item.get("explanation", "")),
                explanation_de=item.get("explanationDe", ""),
                frequency=item.get("frequency", "common"),
                level=item.get("level", "A1"),
            )
            self._add_mistake(mistake)

    def _add_mistake(self, mistake: CommonMistake) -> None:
        """Add a mistake pattern to the index."""
        self._mistakes[mistake.id] = mistake
        self._mistake_patterns[mistake.pattern.lower()] = mistake

    # ===== FAST LOOKUP METHODS (<1ms) =====

    def lookup_grammar(self, query: str) -> List[GrammarRule]:
        """Find grammar rules matching a query. <1ms for exact, <5ms for fuzzy."""
        query_lower = query.lower()
        results = []

        # Check keywords first (fastest)
        for word in query_lower.split():
            if word in self._grammar_by_keyword:
                for rule in self._grammar_by_keyword[word]:
                    if rule not in results:
                        results.append(rule)

        # Check category names
        for category, rules in self._grammar_by_category.items():
            if category in query_lower:
                for rule in rules:
                    if rule not in results:
                        results.append(rule)

        # Fuzzy match on rule names if no results
        if not results:
            for rule in self._grammar_rules.values():
                if self._fuzzy_match(query_lower, rule.name.lower()) > 0.6:
                    results.append(rule)

        return results[:5]  # Max 5 results

    def lookup_vocabulary(self, term: str) -> Optional[VocabularyEntry]:
        """Find a vocabulary entry by term. <1ms."""
        term_lower = term.lower()

        # Exact match in English
        if term_lower in self._vocabulary:
            return self._vocabulary[term_lower]

        # Exact match in German
        if term_lower in self._vocabulary_de:
            return self._vocabulary_de[term_lower]

        return None

    def search_vocabulary(self, query: str, limit: int = 5) -> List[VocabularyEntry]:
        """Search vocabulary with partial matching. <5ms."""
        query_lower = query.lower()
        results = []

        # Partial match
        for term, entry in self._vocabulary.items():
            if query_lower in term or query_lower in entry.definition.lower():
                results.append((1.0, entry))

        # Fuzzy match if needed
        if len(results) < limit:
            for term, entry in self._vocabulary.items():
                if entry not in [r[1] for r in results]:
                    score = self._fuzzy_match(query_lower, term)
                    if score > 0.7:
                        results.append((score, entry))

        # Sort by score and return
        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results[:limit]]

    def check_for_mistakes(self, text: str) -> List[CommonMistake]:
        """Check if text contains common German speaker mistakes. <2ms."""
        text_lower = text.lower()
        found = []

        for pattern, mistake in self._mistake_patterns.items():
            if pattern in text_lower:
                found.append(mistake)

        return found

    def get_grammar_by_category(self, category: str) -> List[GrammarRule]:
        """Get all grammar rules in a category. <1ms."""
        return self._grammar_by_category.get(category.lower(), [])

    def get_vocabulary_by_level(self, level: str) -> List[VocabularyEntry]:
        """Get vocabulary for a specific level. <1ms."""
        return self._vocabulary_by_level.get(level.upper(), [])

    # ===== CONTEXT FORMATTING =====

    def format_grammar_for_context(self, rules: List[GrammarRule]) -> str:
        """Format grammar rules for LLM context injection."""
        if not rules:
            return ""

        parts = ["[RELEVANT GRAMMAR RULES]"]
        for rule in rules[:3]:  # Max 3 rules
            parts.append(f"\n## {rule.name}")
            parts.append(f"Level: {rule.level}")
            parts.append(f"Explanation: {rule.explanation_en}")
            if rule.formula:
                parts.append(f"Formula: {rule.formula}")
            if rule.examples:
                parts.append("Examples:")
                for ex in rule.examples[:2]:
                    parts.append(f"  ✓ {ex.get('correct', '')}")
                    if ex.get('incorrect'):
                        parts.append(f"  ✗ {ex['incorrect']}")

        return "\n".join(parts)

    def format_vocabulary_for_context(self, entries: List[VocabularyEntry]) -> str:
        """Format vocabulary for LLM context injection."""
        if not entries:
            return ""

        parts = ["[VOCABULARY REFERENCE]"]
        for entry in entries[:5]:
            parts.append(f"• {entry.term} ({entry.term_de}) - {entry.definition}")
            if entry.example_sentence:
                parts.append(f"  Example: {entry.example_sentence}")

        return "\n".join(parts)

    def format_mistake_correction(self, mistake: CommonMistake) -> str:
        """Format a mistake correction for the avatar to use."""
        return (
            f"I noticed a common German speaker mistake! "
            f"'{mistake.pattern}' in English means '{mistake.explanation_en}'. "
            f"Instead, you should say '{mistake.correct}'."
        )

    @staticmethod
    def _fuzzy_match(s1: str, s2: str) -> float:
        """Calculate similarity ratio between two strings."""
        return SequenceMatcher(None, s1, s2).ratio()

    @property
    def stats(self) -> Dict:
        """Get statistics about loaded knowledge."""
        return {
            "grammar_rules": len(self._grammar_rules),
            "vocabulary_entries": len(self._vocabulary),
            "mistake_patterns": len(self._mistakes),
            "loaded": self._loaded,
        }


# Global instance
_general_knowledge: Optional[GeneralKnowledgeBase] = None


def get_general_knowledge() -> GeneralKnowledgeBase:
    """Get or create the global general knowledge base."""
    global _general_knowledge
    if _general_knowledge is None:
        _general_knowledge = GeneralKnowledgeBase()
    return _general_knowledge
