"""RLM (Recursive Language Model) Knowledge Provider.

Ultra-fast in-memory knowledge lookups for avatar responses (<10ms).
Loads pre-optimized indexes from Convex knowledge bases generated via web scraping.

Architecture:
- Grammar rules indexed by keywords and tense names
- Vocabulary indexed by English and German terms
- Common mistakes indexed by patterns
- All lookups are O(1) or O(n) where n is small

This complements:
- General Knowledge: Built-in grammar and vocabulary
- Zep Vector Search: Fuzzy document search (200ms+)
"""

import logging
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

logger = logging.getLogger("beethoven-agent.rlm-knowledge")


@dataclass
class RLMGrammarRule:
    """Grammar rule from RLM-optimized data."""
    rule: str
    explanation: str
    examples: List[str] = field(default_factory=list)
    level: str = "B1"
    keywords: List[str] = field(default_factory=list)


@dataclass
class RLMVocabularyEntry:
    """Vocabulary entry from RLM-optimized data."""
    term: str
    term_de: str
    definition: str
    part_of_speech: str
    example: str
    level: str = "B1"
    synonyms: List[str] = field(default_factory=list)


@dataclass
class RLMMistakePattern:
    """Common mistake pattern from RLM-optimized data."""
    pattern: str
    correction: str
    explanation: str
    category: str
    compiled_pattern: Optional[re.Pattern] = None

    def __post_init__(self):
        """Compile regex pattern after initialization."""
        try:
            self.compiled_pattern = re.compile(self.pattern, re.IGNORECASE)
        except re.error:
            logger.warning(f"Invalid regex pattern: {self.pattern}")
            self.compiled_pattern = None


class RLMKnowledgeProvider:
    """Ultra-fast in-memory knowledge lookups (<10ms).

    Loads rlmOptimized data from Convex knowledge bases.
    All indexes are built for O(1) or near-O(1) lookups.
    """

    def __init__(self):
        # Grammar indexed by keyword
        self._grammar_by_keyword: Dict[str, List[RLMGrammarRule]] = {}
        # Vocabulary indexed by English term (lowercase)
        self._vocab_by_term: Dict[str, RLMVocabularyEntry] = {}
        # Vocabulary indexed by German term (lowercase)
        self._vocab_by_term_de: Dict[str, RLMVocabularyEntry] = {}
        # Vocabulary indexed by level
        self._vocab_by_level: Dict[str, List[RLMVocabularyEntry]] = {}
        # Mistake patterns (compiled regex)
        self._mistake_patterns: List[RLMMistakePattern] = []
        # Topic keywords for context matching
        self._topic_keywords: List[str] = []
        # Metadata
        self._loaded_kbs: List[str] = []
        self._stats = {
            "grammar_rules": 0,
            "vocabulary_entries": 0,
            "mistake_patterns": 0,
            "knowledge_bases": 0,
        }

    @property
    def stats(self) -> Dict[str, Any]:
        """Get statistics about loaded knowledge."""
        return {
            **self._stats,
            "loaded_knowledge_bases": self._loaded_kbs,
        }

    def is_loaded(self) -> bool:
        """Check if any RLM data is loaded."""
        return self._stats["knowledge_bases"] > 0

    def load(self, rlm_data: Dict[str, Any], kb_id: str = "unknown") -> None:
        """Load rlmOptimized data from a knowledge base.

        Args:
            rlm_data: The rlmOptimized field from knowledgeContent
            kb_id: Knowledge base identifier for logging
        """
        if not rlm_data:
            return

        # Load grammar index
        grammar_index = rlm_data.get("grammarIndex", {})
        for keyword, rules in grammar_index.items():
            keyword_lower = keyword.lower()
            if keyword_lower not in self._grammar_by_keyword:
                self._grammar_by_keyword[keyword_lower] = []

            for rule_data in rules:
                rule = RLMGrammarRule(
                    rule=rule_data.get("rule", ""),
                    explanation=rule_data.get("explanation", ""),
                    examples=rule_data.get("examples", []),
                    level=rule_data.get("level", "B1"),
                    keywords=rule_data.get("keywords", []),
                )
                self._grammar_by_keyword[keyword_lower].append(rule)
                self._stats["grammar_rules"] += 1

        # Load vocabulary by English term
        vocab_by_term = rlm_data.get("vocabularyByTerm", {})
        for term, entry_data in vocab_by_term.items():
            entry = self._create_vocab_entry(entry_data)
            if entry:
                self._vocab_by_term[term.lower()] = entry
                self._stats["vocabulary_entries"] += 1

        # Load vocabulary by German term
        vocab_by_term_de = rlm_data.get("vocabularyByTermDe", {})
        for term_de, entry_data in vocab_by_term_de.items():
            entry = self._create_vocab_entry(entry_data)
            if entry:
                self._vocab_by_term_de[term_de.lower()] = entry

        # Load vocabulary by level
        vocab_by_level = rlm_data.get("vocabularyByLevel", {})
        for level, entries in vocab_by_level.items():
            if level not in self._vocab_by_level:
                self._vocab_by_level[level] = []
            for entry_data in entries:
                entry = self._create_vocab_entry(entry_data)
                if entry:
                    self._vocab_by_level[level].append(entry)

        # Load mistake patterns
        mistake_patterns = rlm_data.get("mistakePatterns", [])
        for pattern_data in mistake_patterns:
            pattern = RLMMistakePattern(
                pattern=pattern_data.get("pattern", ""),
                correction=pattern_data.get("correction", ""),
                explanation=pattern_data.get("explanation", ""),
                category=pattern_data.get("category", ""),
            )
            if pattern.compiled_pattern:
                self._mistake_patterns.append(pattern)
                self._stats["mistake_patterns"] += 1

        # Load topic keywords
        topic_keywords = rlm_data.get("topicKeywords", [])
        self._topic_keywords.extend(topic_keywords)

        self._loaded_kbs.append(kb_id)
        self._stats["knowledge_bases"] += 1
        logger.info(f"Loaded RLM data from {kb_id}: {self._stats}")

    def _create_vocab_entry(self, entry_data: Dict[str, Any]) -> Optional[RLMVocabularyEntry]:
        """Create a vocabulary entry from raw data."""
        if not entry_data or not entry_data.get("term"):
            return None
        return RLMVocabularyEntry(
            term=entry_data.get("term", ""),
            term_de=entry_data.get("termDe", entry_data.get("term_de", "")),
            definition=entry_data.get("definition", ""),
            part_of_speech=entry_data.get("partOfSpeech", entry_data.get("part_of_speech", "")),
            example=entry_data.get("example", ""),
            level=entry_data.get("level", "B1"),
            synonyms=entry_data.get("synonyms", []),
        )

    def lookup_grammar(self, query: str) -> List[RLMGrammarRule]:
        """Keyword-based grammar lookup (<1ms).

        Searches for grammar rules matching keywords in the query.
        """
        if not self._grammar_by_keyword:
            return []

        results: List[RLMGrammarRule] = []
        seen_rules: set = set()
        query_lower = query.lower()
        words = query_lower.split()

        # Search by individual words and common phrases
        search_terms = set(words)

        # Add common multi-word grammar terms
        grammar_phrases = [
            "present perfect", "past simple", "present simple",
            "future tense", "conditional", "passive voice",
            "past participle", "gerund", "infinitive",
            "modal verb", "phrasal verb", "relative clause",
            "article", "preposition", "conjunction",
        ]
        for phrase in grammar_phrases:
            if phrase in query_lower:
                search_terms.add(phrase)

        for term in search_terms:
            if term in self._grammar_by_keyword:
                for rule in self._grammar_by_keyword[term]:
                    # Dedupe by rule text
                    if rule.rule not in seen_rules:
                        results.append(rule)
                        seen_rules.add(rule.rule)

        return results[:5]  # Limit to top 5 rules

    def lookup_vocabulary(self, term: str) -> Optional[RLMVocabularyEntry]:
        """O(1) vocabulary lookup by English or German term.

        Args:
            term: English or German word to look up

        Returns:
            Vocabulary entry if found, None otherwise
        """
        term_lower = term.lower().strip()

        # Try English first
        entry = self._vocab_by_term.get(term_lower)
        if entry:
            return entry

        # Try German
        return self._vocab_by_term_de.get(term_lower)

    def lookup_vocabulary_by_level(self, level: str) -> List[RLMVocabularyEntry]:
        """Get all vocabulary at a specific CEFR level."""
        return self._vocab_by_level.get(level, [])

    def check_mistakes(self, text: str) -> List[RLMMistakePattern]:
        """Pattern matching for common errors (<2ms).

        Checks text against compiled regex patterns.
        Returns all matching mistake patterns.
        """
        if not self._mistake_patterns or not text:
            return []

        matches: List[RLMMistakePattern] = []
        for pattern in self._mistake_patterns:
            if pattern.compiled_pattern and pattern.compiled_pattern.search(text):
                matches.append(pattern)

        return matches

    def is_topic_relevant(self, text: str) -> bool:
        """Check if text is relevant to loaded topics."""
        if not self._topic_keywords:
            return False

        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self._topic_keywords)

    def format_grammar_for_context(self, rules: List[RLMGrammarRule]) -> str:
        """Format grammar rules for LLM context injection."""
        if not rules:
            return ""

        parts = ["[RLM GRAMMAR KNOWLEDGE]"]
        for rule in rules[:3]:  # Limit to 3 rules
            parts.append(f"\n**{rule.rule}** ({rule.level})")
            parts.append(rule.explanation)
            if rule.examples:
                parts.append("Examples: " + "; ".join(rule.examples[:2]))

        return "\n".join(parts)

    def format_vocabulary_for_context(self, entries: List[RLMVocabularyEntry]) -> str:
        """Format vocabulary entries for LLM context injection."""
        if not entries:
            return ""

        parts = ["[RLM VOCABULARY]"]
        for entry in entries[:5]:  # Limit to 5 entries
            parts.append(
                f"- **{entry.term}** ({entry.term_de}) - {entry.part_of_speech}: "
                f"{entry.definition}"
            )
            if entry.example:
                parts.append(f"  *Example: {entry.example}*")

        return "\n".join(parts)

    def format_mistake_for_context(self, pattern: RLMMistakePattern) -> str:
        """Format a mistake pattern for LLM context injection."""
        return (
            f"[RLM MISTAKE DETECTED - {pattern.category}]\n"
            f"Student may have made this error: {pattern.pattern}\n"
            f"Correction: {pattern.correction}\n"
            f"Explanation: {pattern.explanation}"
        )


# Global instance
_rlm_provider: Optional[RLMKnowledgeProvider] = None


def get_rlm_provider() -> RLMKnowledgeProvider:
    """Get or create the global RLM knowledge provider."""
    global _rlm_provider
    if _rlm_provider is None:
        _rlm_provider = RLMKnowledgeProvider()
    return _rlm_provider


async def load_rlm_from_convex(
    convex_client,
    avatar_id: str,
    knowledge_base_ids: Optional[List[str]] = None
) -> RLMKnowledgeProvider:
    """Load RLM data from Convex for an avatar.

    Args:
        convex_client: Convex client instance
        avatar_id: Avatar ID to load knowledge bases for
        knowledge_base_ids: Specific KB IDs to load, or None for all linked

    Returns:
        Initialized RLMKnowledgeProvider
    """
    provider = get_rlm_provider()

    try:
        # Get avatar's linked knowledge bases
        if knowledge_base_ids:
            kb_ids = knowledge_base_ids
        else:
            # Query avatar's knowledge base links
            avatar = await convex_client.query("avatars:getById", {"id": avatar_id})
            kb_ids = avatar.get("knowledgeBaseIds", []) if avatar else []

        if not kb_ids:
            logger.info(f"No knowledge bases linked to avatar {avatar_id}")
            return provider

        # Load RLM data from each knowledge base
        for kb_id in kb_ids:
            try:
                # Get all content with rlmOptimized data
                contents = await convex_client.query(
                    "knowledgeBases:getContent",
                    {"knowledgeBaseId": kb_id}
                )

                for content in contents:
                    rlm_data = content.get("rlmOptimized")
                    if rlm_data:
                        provider.load(rlm_data, kb_id=content.get("_id", kb_id))

            except Exception as e:
                logger.warning(f"Failed to load RLM from KB {kb_id}: {e}")
                continue

        logger.info(f"RLM provider loaded: {provider.stats}")

    except Exception as e:
        logger.error(f"Failed to load RLM data: {e}")

    return provider
