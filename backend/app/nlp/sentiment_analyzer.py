import spacy
from transformers import pipeline

from typing import Dict, Any, Optional
import re
import logging

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    def __init__(self):
        self.nlp = None
        self.sentiment_pipeline = None
        self.initialize_models()

    def initialize_models(self):
        """Initialize NLP models"""
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")

            # Load HuggingFace sentiment pipeline
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                return_all_scores=True,
            )

            logger.info("NLP models initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize NLP models: {e}")
            raise

    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        if not text:
            return ""

        # Remove URLs
        text = re.sub(
            r"https?://[\w$\-@.&+!*(),\d%]+",
            "",
            text,
        )

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text).strip()

        # Remove special characters but keep punctuation
        text = re.sub(r"[^\w\s.!?,;:\-()]", "", text)

        return text

    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract named entities from text"""
        if not text or not self.nlp:
            return {"organizations": [], "people": [], "money": [], "locations": []}
            
        doc = self.nlp(text)
        entities = {"organizations": [], "people": [], "money": [], "locations": []}

        for ent in doc.ents:
            if ent.label_ in ["ORG", "CORP"]:
                entities["organizations"].append(ent.text)
            elif ent.label_ == "PERSON":
                entities["people"].append(ent.text)
            elif ent.label_ == "MONEY":
                entities["money"].append(ent.text)
            elif ent.label_ in ["GPE", "LOC"]:
                entities["locations"].append(ent.text)

        return entities

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        try:
            if not self.sentiment_pipeline:
                raise ValueError("Sentiment pipeline not initialized")

            # Preprocess text
            clean_text = self.preprocess_text(text)

            if not clean_text:
                return {
                    "sentiment_score": 0.0,
                    "sentiment_label": "neutral",
                    "confidence": 0.0,
                    "recommendation": "hold",
                    "analysis_model": "twitter-roberta-base-sentiment",
                }

            # Get sentiment scores
            results = self.sentiment_pipeline(clean_text[:512])  # Limit to 512 chars

            # Process results
            sentiment_scores = {}
            # results is a list of lists (batch), so take the first element if needed
            result_list = results[0] if isinstance(results, list) and len(results) > 0 and isinstance(results[0], list) else results
            if result_list is not None:
                for result in result_list:
                    if isinstance(result, dict):
                        label = str(result.get("label", "")).lower()
                        score = float(result.get("score", 0.0))
                        sentiment_scores[label] = score
                    else:
                        logger.error(f"Unexpected result type: {type(result)}; expected dict.")
            else:
                logger.error("Sentiment pipeline returned None as result_list")
                return {
                    "sentiment_score": 0.0,
                    "sentiment_label": "neutral",
                    "confidence": 0.0,
                    "recommendation": "hold",
                    "analysis_model": "twitter-roberta-base-sentiment",
                }

            # Determine primary sentiment
            primary_sentiment = max(sentiment_scores.items(), key=lambda x: x[1])[0]
            confidence = float(sentiment_scores[primary_sentiment])

            # Convert to numeric score (-1 to 1)
            if primary_sentiment == "negative":
                sentiment_score = -float(sentiment_scores["negative"])
            elif primary_sentiment == "positive":
                sentiment_score = float(sentiment_scores["positive"])
            else:
                sentiment_score = 0.0

            # Generate recommendation
            recommendation = self.generate_recommendation(sentiment_score, confidence)

            return {
                "sentiment_score": sentiment_score,
                "sentiment_label": primary_sentiment,
                "confidence": confidence,
                "recommendation": recommendation,
                "analysis_model": "twitter-roberta-base-sentiment",
            }

        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                "sentiment_score": 0.0,
                "sentiment_label": "neutral",
                "confidence": 0.0,
                "recommendation": "hold",
                "analysis_model": "twitter-roberta-base-sentiment",
            }

    def generate_recommendation(self, sentiment_score: float, confidence: float) -> str:
        """Generate buy/sell/hold recommendation based on sentiment"""
        # Only make strong recommendations with high confidence
        if confidence < 0.7:
            return "hold"

        if sentiment_score > 0.3:
            return "buy"
        elif sentiment_score < -0.3:
            return "sell"
        else:
            return "hold"

    def analyze_article(self, title: str, content: Optional[str] = None) -> Dict[str, Any]:
        """Analyze full article sentiment"""
        if not title:
            return {
                "sentiment_score": 0.0,
                "sentiment_label": "neutral",
                "confidence": 0.0,
                "recommendation": "hold",
                "analysis_model": "twitter-roberta-base-sentiment",
                "entities": {"organizations": [], "people": [], "money": [], "locations": []},
                "text_length": 0
            }

        # Combine title and content with title weighted more heavily
        text_to_analyze = title
        if content:
            text_to_analyze += " " + content[:1000]  # Limit content length

        # Get sentiment analysis
        sentiment_result = self.analyze_sentiment(text_to_analyze)

        # Extract entities
        entities = self.extract_entities(text_to_analyze)

        # Combine results
        result = {
            **sentiment_result,
            "entities": entities,
            "text_length": len(text_to_analyze),
        }

        return result
