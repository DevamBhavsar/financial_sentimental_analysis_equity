import spacy


class TickerExtractor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")

    def extract_tickers(self, text: str) -> list[str]:
        doc = self.nlp(text)
        tickers = []
        for ent in doc.ents:
            if ent.label_ == "ORG":
                # This is a simple example, a real implementation would need a more robust way to identify tickers
                # For example, by checking against a list of known tickers
                if len(ent.text) <= 5 and ent.text.isupper():
                    tickers.append(ent.text)
        return tickers