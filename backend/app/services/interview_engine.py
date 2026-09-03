class InterviewEngine:
    """
    Placeholder service for simulating AI technical and behavioral interviews with speech transcription.
    """
    @staticmethod
    def generate_question(role: str, previous_answers: list) -> dict:
        return {
            "question": "Can you explain your experience with relational databases?",
            "category": "technical"
        }

    @staticmethod
    def evaluate_response(question_id: str, transcript: str) -> dict:
        return {
            "communication_score": 76.0,
            "technical_score": 71.0,
            "feedback": ""
        }


interview_engine = InterviewEngine()

