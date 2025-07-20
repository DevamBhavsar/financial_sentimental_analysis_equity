from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        self.model_name = model_name
        self.classifier = None
        try:
            logger.info(f"Attempting to load sentiment analysis model: {self.model_name}")
            
            # Check if model and tokenizer are available before creating the pipeline
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            model = AutoModelForSequenceClassification.from_pretrained(self.model_name)

            # Create the pipeline for sentiment analysis
            self.classifier = pipeline(
                "sentiment-analysis",
                model=model,
                tokenizer=tokenizer,
                truncation=True
            )
            logger.info("Sentiment analysis model loaded successfully.")

        except Exception as e:
            logger.critical(f"CRITICAL: Failed to load sentiment analysis model '{self.model_name}'. NLP features will be disabled. Error: {e}", exc_info=True)
            # This allows the app to start, but analysis will fail gracefully.
            self.classifier = None

    def analyze(self, text: str) -> dict:
        """
        Analyzes the sentiment of a given text, returning a dictionary with 'label' and 'score'.
        """
        if not self.classifier:
            logger.error("Sentiment classifier is not available. Cannot analyze text.")
            return {"label": "UNAVAILABLE", "score": 0.0}

        try:
            # The pipeline returns a list containing one dictionary.
            result = self.classifier(text)[0]
            return {
                "label": result["label"],
                "score": round(result["score"], 4),
            }
        except Exception as e:
            logger.error(f"Error during sentiment analysis for text: '{text[:50]}...'. Error: {e}")
            return {"label": "ERROR", "score": 0.0}