import re
import pandas as pd
import nltk
from nltk.corpus import stopwords
nltk.download('stopwords')
print("loading data : ")
dataframe =  pd.read_csv("/home/devam/sentimental_analysis/datasets/IMDB Dataset.csv")
print("Proccessing data : ")
stop_words = set(stopwords.words('english'))
def preprocess(text) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub("r'<.*?>'", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
    text =' '.join([word for word in text.split() if word not in stop_words])
    return text

dataframe["processed_text"] = dataframe["review"].apply(preprocess)
print(f"Data proccessed : \n{dataframe['processed_text'].head()}")