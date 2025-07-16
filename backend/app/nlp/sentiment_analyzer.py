from transformers import pipeline


class SentimentAnalyzer:
    def __init__(self, model_name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
        self.model_name = model_name
        self.classifier = pipeline(
            "sentiment-analysis", model=self.model_name, truncation=True
        )

    def analyze(self, text: str) -> dict:
        result = self.classifier(text)[0]
        return {
            "label": result["label"],
            "score": result["score"],
            "confidence": result["score"],
        }