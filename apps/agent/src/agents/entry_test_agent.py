"""
Entry Test Avatar Agent

A LiveKit agent that conducts entry tests with students using:
- Avatar (Beyond Presence) for visual interaction
- TTS (Cartesia) for speaking questions
- STT (Deepgram) for listening to responses
- LLM for scoring spoken/written responses

The agent:
1. Greets the student and explains the test
2. Presents questions from each section
3. Listens to/collects responses
4. Provides encouragement between questions
5. Scores responses in real-time
6. Announces results at the end
"""

import logging
import json
import os
import time
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum

from livekit import rtc
from livekit.agents import JobContext
from livekit.agents.voice import AgentSession, Agent
from livekit.agents.llm import ChatMessage, ChatRole
from livekit.plugins import deepgram, cartesia, bey

from ..utils.config import Config
from ..utils.convex_client import ConvexClient
from ..providers.llm.openrouter import OpenRouterLLM

logger = logging.getLogger("entry-test-agent")


class TestState(Enum):
    """States for the entry test flow."""
    INTRO = "intro"
    SECTION_INTRO = "section_intro"
    ASKING_QUESTION = "asking_question"
    WAITING_RESPONSE = "waiting_response"
    PROVIDING_FEEDBACK = "providing_feedback"
    SECTION_COMPLETE = "section_complete"
    TEST_COMPLETE = "test_complete"


class EntryTestAgent:
    """
    Avatar agent for conducting entry tests.
    """

    def __init__(
        self,
        session_id: str,
        convex_client: ConvexClient,
        config: Config,
    ):
        self.session_id = session_id
        self.convex = convex_client
        self.config = config

        # Test state
        self.state = TestState.INTRO
        self.current_section_index = 0
        self.current_question_index = 0
        self.answers: List[Dict[str, Any]] = []

        # Session data (loaded from Convex)
        self.session: Optional[Dict[str, Any]] = None
        self.template: Optional[Dict[str, Any]] = None
        self.questions: List[Dict[str, Any]] = []
        self.sections: List[Dict[str, Any]] = []

        # Timing
        self.question_start_time: Optional[float] = None

        # LLM for scoring
        self.scoring_llm: Optional[OpenRouterLLM] = None

        # Phrases for encouragement
        self.encouragement_phrases = [
            "Good job! Let's move on to the next question.",
            "Great! Here's the next one.",
            "Well done! Moving on.",
            "Nice effort! Let's continue.",
            "Excellent! Next question coming up.",
        ]

    async def initialize(self) -> bool:
        """Load session data from Convex."""
        try:
            # Get session with questions
            self.session = await self.convex.query(
                "entryTestSessions:getSessionWithQuestions",
                {"sessionId": self.session_id}
            )

            if not self.session:
                logger.error(f"Session not found: {self.session_id}")
                return False

            # Get template
            template_id = self.session.get("templateId")
            self.template = await self.convex.query(
                "entryTests:getTemplate",
                {"templateId": template_id}
            )

            if not self.template:
                logger.error(f"Template not found: {template_id}")
                return False

            # Parse questions and sections
            self.questions = self.session.get("questionInstances", [])
            self.sections = self.template.get("sections", [])

            # Initialize scoring LLM
            self.scoring_llm = OpenRouterLLM(
                api_key=os.environ.get("OPENROUTER_API_KEY", ""),
                model="anthropic/claude-3-5-haiku-20241022",  # Fast model for scoring
            )

            # Restore state if resuming
            current_state = self.session.get("currentState", {})
            self.current_section_index = current_state.get("currentSectionIndex", 0)
            self.current_question_index = current_state.get("currentQuestionIndex", 0)

            logger.info(
                f"Initialized entry test: {len(self.questions)} questions, "
                f"{len(self.sections)} sections"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to initialize entry test: {e}")
            return False

    def get_current_section(self) -> Optional[Dict[str, Any]]:
        """Get the current section."""
        if 0 <= self.current_section_index < len(self.sections):
            return self.sections[self.current_section_index]
        return None

    def get_current_question(self) -> Optional[Dict[str, Any]]:
        """Get the current question."""
        section = self.get_current_section()
        if not section:
            return None

        section_id = section.get("id")
        section_questions = [
            q for q in self.questions
            if q.get("sectionId") == section_id
        ]

        if 0 <= self.current_question_index < len(section_questions):
            return section_questions[self.current_question_index]
        return None

    def get_section_questions(self, section_id: str) -> List[Dict[str, Any]]:
        """Get all questions for a section."""
        return [q for q in self.questions if q.get("sectionId") == section_id]

    async def generate_intro_message(self) -> str:
        """Generate the introduction message."""
        title = self.template.get("title", "Entry Test")
        total_questions = len(self.questions)
        total_sections = len(self.sections)

        return f"""
Hello! Welcome to the {title}.

This test will help us determine your current English level.
You'll answer {total_questions} questions across {total_sections} sections.

Take your time - there's no time limit.
I'll guide you through each section.

Are you ready to begin?
        """.strip()

    async def generate_section_intro(self) -> str:
        """Generate section introduction."""
        section = self.get_current_section()
        if not section:
            return "Let's continue with the test."

        title = section.get("title", "Next Section")
        instructions = section.get("instructions_en", "")
        section_questions = self.get_section_questions(section.get("id", ""))
        count = len(section_questions)

        return f"""
Now we're moving to the {title} section.

{instructions}

There are {count} questions in this section.
Let's begin!
        """.strip()

    async def generate_question_prompt(self) -> str:
        """Generate the spoken question prompt."""
        question = self.get_current_question()
        if not question:
            return "I couldn't find the next question."

        content = question.get("content", {})
        q_type = question.get("type", "")

        # Format question based on type
        if q_type in ["grammar_mcq", "vocabulary_mcq", "listening_mcq"]:
            return self._format_mcq_question(content)
        elif q_type in ["grammar_fill_blank", "listening_fill_blank"]:
            return self._format_fill_blank_question(content)
        elif q_type == "reading_comprehension":
            return self._format_reading_question(content)
        elif q_type == "vocabulary_matching":
            return self._format_matching_question(content)
        elif q_type == "writing_prompt":
            return self._format_writing_prompt(content)
        elif q_type == "speaking_prompt":
            return self._format_speaking_prompt(content)
        else:
            return f"Here's your question: {json.dumps(content)}"

    def _format_mcq_question(self, content: Dict[str, Any]) -> str:
        """Format MCQ question for speech."""
        question = content.get("question", content.get("sentence", ""))
        options = content.get("options", [])

        text = f"Question: {question}\n\nYour options are:\n"
        for i, opt in enumerate(options):
            text += f"Option {chr(65 + i)}: {opt}\n"
        text += "\nPlease say the letter of your answer, A, B, C, or D."

        return text

    def _format_fill_blank_question(self, content: Dict[str, Any]) -> str:
        """Format fill-in-the-blank question."""
        sentence = content.get("sentence", content.get("displayText", ""))
        hint = content.get("hint", "")

        text = f"Complete the sentence: {sentence}"
        if hint:
            text += f"\n\nHint: {hint}"
        text += "\n\nPlease say your answer."

        return text

    def _format_reading_question(self, content: Dict[str, Any]) -> str:
        """Format reading comprehension question."""
        passage = content.get("passage", "")
        questions = content.get("questions", [])

        text = f"Please read the following passage:\n\n{passage}\n\n"
        text += "I'll now ask you questions about this passage.\n"

        if questions:
            first_q = questions[0]
            text += f"\nFirst question: {first_q.get('question', '')}\n"
            for i, opt in enumerate(first_q.get("options", [])):
                text += f"Option {chr(65 + i)}: {opt}\n"

        return text

    def _format_matching_question(self, content: Dict[str, Any]) -> str:
        """Format vocabulary matching question."""
        pairs = content.get("pairs", [])

        text = "Match the words with their definitions.\n\n"
        text += "Words:\n"
        for i, pair in enumerate(pairs):
            text += f"{i + 1}. {pair.get('term', '')}\n"

        text += "\nDefinitions:\n"
        for i, pair in enumerate(pairs):
            text += f"{chr(65 + i)}. {pair.get('definition', '')}\n"

        text += "\nPlease say your matches, like '1 is A, 2 is B', and so on."

        return text

    def _format_writing_prompt(self, content: Dict[str, Any]) -> str:
        """Format writing prompt."""
        prompt = content.get("prompt", "")
        word_range = content.get("wordCountRange", {})
        min_words = word_range.get("min", 50)
        max_words = word_range.get("max", 150)

        return f"""
Writing task: {prompt}

Please write {min_words} to {max_words} words.
Take your time to compose your response.
Say "I'm finished" when you're done speaking your answer.
        """.strip()

    def _format_speaking_prompt(self, content: Dict[str, Any]) -> str:
        """Format speaking prompt."""
        prompt = content.get("prompt", "")
        prep_time = content.get("preparationTimeSeconds", 30)

        return f"""
Speaking task: {prompt}

You have {prep_time} seconds to prepare.
Then speak your answer clearly.
Say "I'm finished" when you're done.
        """.strip()

    async def score_response(
        self,
        question: Dict[str, Any],
        response: str
    ) -> Dict[str, Any]:
        """Score a student's response."""
        q_type = question.get("type", "")
        content = question.get("content", {})
        cefr_level = question.get("cefrLevel", "B1")

        # Objective scoring for MCQ and fill-blank
        if q_type in ["grammar_mcq", "vocabulary_mcq", "listening_mcq"]:
            return self._score_mcq(content, response)
        elif q_type in ["grammar_fill_blank", "listening_fill_blank"]:
            return self._score_fill_blank(content, response)
        elif q_type == "vocabulary_matching":
            return self._score_matching(content, response)
        else:
            # Use LLM for subjective scoring
            return await self._score_with_llm(q_type, content, response, cefr_level)

    def _score_mcq(self, content: Dict[str, Any], response: str) -> Dict[str, Any]:
        """Score MCQ response."""
        correct_answer = content.get("correctAnswer", 0)
        options = content.get("options", [])

        # Parse response (A, B, C, D or the actual text)
        response_upper = response.strip().upper()

        selected_index = None
        if len(response_upper) == 1 and response_upper in "ABCD":
            selected_index = ord(response_upper) - ord('A')
        else:
            # Try to match the response text
            for i, opt in enumerate(options):
                if opt.lower() in response.lower():
                    selected_index = i
                    break

        is_correct = selected_index == correct_answer

        return {
            "isCorrect": is_correct,
            "score": 1 if is_correct else 0,
            "maxScore": 1,
            "selectedAnswer": selected_index,
            "correctAnswer": correct_answer,
        }

    def _score_fill_blank(self, content: Dict[str, Any], response: str) -> Dict[str, Any]:
        """Score fill-in-the-blank response."""
        correct_answers = content.get("correctAnswers", [content.get("correctAnswer", "")])
        if isinstance(correct_answers, str):
            correct_answers = [correct_answers]

        response_clean = response.strip().lower()
        is_correct = any(
            ans.lower() == response_clean
            for ans in correct_answers
        )

        return {
            "isCorrect": is_correct,
            "score": 1 if is_correct else 0,
            "maxScore": 1,
            "givenAnswer": response,
            "correctAnswers": correct_answers,
        }

    def _score_matching(self, content: Dict[str, Any], response: str) -> Dict[str, Any]:
        """Score vocabulary matching response."""
        pairs = content.get("pairs", [])
        # This is simplified - in practice you'd parse the matches from speech
        return {
            "isCorrect": False,
            "score": 0,
            "maxScore": len(pairs),
            "givenAnswer": response,
            "note": "Matching questions require manual review",
        }

    async def _score_with_llm(
        self,
        q_type: str,
        content: Dict[str, Any],
        response: str,
        cefr_level: str
    ) -> Dict[str, Any]:
        """Score subjective responses with LLM."""
        if not self.scoring_llm:
            return {"score": 0, "maxScore": 10, "feedback": "Scoring unavailable"}

        prompt = f"""
You are a Cambridge English Assessment scorer. Score this {q_type} response.

CEFR Level: {cefr_level}
Question: {json.dumps(content)}
Student Response: {response}

Score out of 10 and provide brief feedback.
Consider: grammar, vocabulary, coherence, task completion.

Return JSON:
{{"score": <0-10>, "maxScore": 10, "feedback": "<brief feedback>", "strengths": ["..."], "weaknesses": ["..."]}}
        """

        try:
            result = await self.scoring_llm.complete(prompt)
            return json.loads(result)
        except Exception as e:
            logger.error(f"LLM scoring failed: {e}")
            return {"score": 5, "maxScore": 10, "feedback": "Score estimated"}

    async def record_answer(
        self,
        question: Dict[str, Any],
        response: str,
        score_result: Dict[str, Any]
    ):
        """Record answer to Convex with score."""
        try:
            time_spent = 0
            if self.question_start_time:
                time_spent = int(time.time() - self.question_start_time)

            await self.convex.mutation(
                "entryTestSessions:recordAnswer",
                {
                    "sessionId": self.session_id,
                    "instanceId": question.get("instanceId"),
                    "answer": response,
                    "isCorrect": score_result.get("isCorrect"),
                    "score": score_result.get("score"),
                    "maxScore": score_result.get("maxScore"),
                    "feedback": score_result.get("feedback"),
                    "timeSpentSeconds": time_spent,
                }
            )

            self.answers.append({
                "instanceId": question.get("instanceId"),
                "answer": response,
                "score": score_result,
            })

        except Exception as e:
            logger.error(f"Failed to record answer: {e}")

    async def advance_to_next_question(self) -> bool:
        """Advance to next question. Returns False if test is complete."""
        section = self.get_current_section()
        if not section:
            return False

        section_questions = self.get_section_questions(section.get("id", ""))

        # Try next question in section
        if self.current_question_index + 1 < len(section_questions):
            self.current_question_index += 1
            return True

        # Try next section
        if self.current_section_index + 1 < len(self.sections):
            self.current_section_index += 1
            self.current_question_index = 0
            self.state = TestState.SECTION_INTRO
            return True

        # Test complete
        self.state = TestState.TEST_COMPLETE
        return False

    async def update_session_state(self):
        """Update session state in Convex."""
        try:
            await self.convex.mutation(
                "entryTestSessions:updateProgress",
                {
                    "sessionId": self.session_id,
                    "currentSectionIndex": self.current_section_index,
                    "currentQuestionIndex": self.current_question_index,
                }
            )
        except Exception as e:
            logger.error(f"Failed to update session state: {e}")

    async def complete_test(self) -> Dict[str, Any]:
        """Complete the test and get results."""
        try:
            # Trigger scoring
            result = await self.convex.mutation(
                "entryTestSessions:completeTest",
                {"sessionId": self.session_id}
            )
            return result
        except Exception as e:
            logger.error(f"Failed to complete test: {e}")
            return {}

    def get_encouragement(self) -> str:
        """Get a random encouragement phrase."""
        import random
        return random.choice(self.encouragement_phrases)

    async def generate_results_message(self, results: Dict[str, Any]) -> str:
        """Generate the final results message."""
        overall = results.get("overallResult", {})
        cefr_level = overall.get("cefrLevel", "B1")
        percentage = overall.get("percentageScore", 0)

        return f"""
Congratulations! You've completed the entry test.

Your estimated CEFR level is: {cefr_level}
Overall score: {percentage}%

This assessment helps us personalize your learning experience.
Thank you for taking the test!
        """.strip()


async def create_entry_test_session(
    ctx: JobContext,
    session_id: str,
    config: Config,
) -> Optional[AgentSession]:
    """
    Create a LiveKit agent session for entry test.

    Args:
        ctx: LiveKit job context
        session_id: Entry test session ID from Convex
        config: Application config

    Returns:
        AgentSession if successful
    """
    logger.info(f"Creating entry test session: {session_id}")

    # Initialize Convex client
    convex = ConvexClient(
        url=os.environ.get("CONVEX_URL", ""),
        token=os.environ.get("CONVEX_ADMIN_TOKEN", ""),
    )

    # Create agent
    agent = EntryTestAgent(
        session_id=session_id,
        convex_client=convex,
        config=config,
    )

    # Initialize (load data from Convex)
    if not await agent.initialize():
        logger.error("Failed to initialize entry test agent")
        return None

    # Set up STT
    stt = deepgram.STT(
        model="nova-2",
        language="en",
    )

    # Set up TTS
    tts = cartesia.TTS(
        model="sonic-english",
        voice="a0e99841-438c-4a64-b679-ae501e7d6091",  # Professional female voice
    )

    # Set up avatar (optional)
    avatar = None
    if os.environ.get("BEY_API_KEY"):
        try:
            avatar = bey.Avatar(
                avatar_id=os.environ.get("BEY_AVATAR_ID", ""),
            )
        except Exception as e:
            logger.warning(f"Avatar initialization failed: {e}")

    # Create LLM for conversation (handles follow-ups, clarifications)
    llm_instance = OpenRouterLLM(
        api_key=os.environ.get("OPENROUTER_API_KEY", ""),
        model="anthropic/claude-3-5-haiku-20241022",
    )

    # Create voice agent
    async def on_user_speech(text: str):
        """Handle user speech."""
        logger.info(f"User said: {text}")

        if agent.state == TestState.WAITING_RESPONSE:
            # Score the response
            question = agent.get_current_question()
            if question:
                score_result = await agent.score_response(question, text)
                await agent.record_answer(question, text, score_result)

                # Advance to next question
                has_more = await agent.advance_to_next_question()
                await agent.update_session_state()

                if has_more:
                    agent.state = TestState.ASKING_QUESTION
                else:
                    agent.state = TestState.TEST_COMPLETE

    async def get_agent_response() -> str:
        """Get next agent response based on state."""
        if agent.state == TestState.INTRO:
            agent.state = TestState.SECTION_INTRO
            return await agent.generate_intro_message()

        elif agent.state == TestState.SECTION_INTRO:
            agent.state = TestState.ASKING_QUESTION
            return await agent.generate_section_intro()

        elif agent.state == TestState.ASKING_QUESTION:
            agent.question_start_time = time.time()
            agent.state = TestState.WAITING_RESPONSE
            return await agent.generate_question_prompt()

        elif agent.state == TestState.PROVIDING_FEEDBACK:
            agent.state = TestState.ASKING_QUESTION
            return agent.get_encouragement()

        elif agent.state == TestState.SECTION_COMPLETE:
            if agent.current_section_index + 1 < len(agent.sections):
                agent.current_section_index += 1
                agent.current_question_index = 0
                agent.state = TestState.SECTION_INTRO
                return "Great work on that section! Let's move to the next one."
            else:
                agent.state = TestState.TEST_COMPLETE
                return "You've completed all sections!"

        elif agent.state == TestState.TEST_COMPLETE:
            results = await agent.complete_test()
            return await agent.generate_results_message(results)

        return "I'm not sure what to say."

    # This is a simplified session - in practice you'd integrate with
    # LiveKit's voice agent pipeline more fully
    logger.info("Entry test agent ready")

    return agent
