import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from newsapi import NewsApiClient
from ..config import settings
from ..models.article import Article
from ..nlp.ticker_extractor import TickerExtractor

logger = logging.getLogger(__name__)


class NewsService:
    def __init__(self):
        self.news_api = NewsApiClient(api_key=settings.news_api_key) if settings.news_api_key else None
        self.ticker_extractor = TickerExtractor()
        self.alpha_vantage_key = settings.alpha_vantage_api_key
    
    async def fetch_news_for_ticker(self, ticker: str, days: int = 7) -> List[Dict[str, Any]]:
        """Fetch news articles for a specific ticker"""
        articles = []
        
        try:
            # Fetch from NewsAPI
            if self.news_api:
                news_articles = await self._fetch_from_news_api(ticker, days)
                articles.extend(news_articles)
            
            # Fetch from Alpha Vantage
            if self.alpha_vantage_key:
                av_articles = await self._fetch_from_alpha_vantage(ticker)
                articles.extend(av_articles)
            
        except Exception as e:
            logger.error(f"Failed to fetch news for {ticker}: {e}")
        
        return articles
    
    async def _fetch_from_news_api(self, ticker: str, days: int) -> List[Dict[str, Any]]:
        """Fetch articles from NewsAPI"""
        try:
            if not self.news_api:
                logger.error("NewsAPI client is not initialized.")
                return []

            from_date = datetime.now() - timedelta(days=days)
            
            # Search for ticker symbol and company name
            query = f"{ticker} OR stock OR market OR finance"
            
            articles = self.news_api.get_everything(
                q=query,
                from_param=from_date.strftime('%Y-%m-%d'),
                language='en',
                sort_by='publishedAt',
                page_size=20
            )
            
            processed_articles = []
            for article in articles.get('articles', []):
                processed_article = {
                    'title': article['title'],
                    'content': article['content'] or article['description'],
                    'url': article['url'],
                    'source': article['source']['name'],
                    'author': article['author'],
                    'published_at': datetime.fromisoformat(
                        article['publishedAt'].replace('Z', '+00:00')
                    ),
                    'ticker': ticker
                }
                processed_articles.append(processed_article)
            
            return processed_articles
            
        except Exception as e:
            logger.error(f"NewsAPI fetch failed: {e}")
            return []
    
    async def _fetch_from_alpha_vantage(self, ticker: str) -> List[Dict[str, Any]]:
        """Fetch news from Alpha Vantage"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"https://www.alphavantage.co/query"
                params = {
                    'function': 'NEWS_SENTIMENT',
                    'tickers': ticker,
                    'apikey': self.alpha_vantage_key,
                    'limit': 20
                }
                
                response = await client.get(url, params=params)
                data = response.json()
                
                if 'feed' not in data:
                    return []
                
                processed_articles = []
                for article in data['feed']:
                    processed_article = {
                        'title': article['title'],
                        'content': article['summary'],
                        'url': article['url'],
                        'source': article['source'],
                        'author': article.get('authors', [{}])[0].get('name'),
                        'published_at': datetime.strptime(
                            article['time_published'], 
                            '%Y%m%dT%H%M%S'
                        ),
                        'ticker': ticker
                    }
                    processed_articles.append(processed_article)
                
                return processed_articles
                
        except Exception as e:
            logger.error(f"Alpha Vantage fetch failed: {e}")
            return []
    
    async def fetch_general_market_news(self, days: int = 1) -> List[Dict[str, Any]]:
        """Fetch general market news"""
        try:
            if not self.news_api:
                return []
            
            from_date = datetime.now() - timedelta(days=days)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://newsapi.org/v2/everything',
                    params={
                        'q': "stock market OR finance OR economy OR trading",
                        'from': from_date.strftime('%Y-%m-%d'),
                        'language': 'en',
                        'sortBy': 'publishedAt',
                        'pageSize': 50,
                        'apiKey': settings.news_api_key
                    }
                )
                articles = response.json()
            
            processed_articles = []
            for article in articles.get('articles', []):
                # Extract tickers from content
                tickers = self.ticker_extractor.extract_from_article(
                    article['title'], 
                    article['content'] or article['description']
                )
                
                processed_article = {
                    'title': article['title'],
                    'content': article['content'] or article['description'],
                    'url': article['url'],
                    'source': article['source']['name'],
                    'author': article['author'],
                    'published_at': datetime.fromisoformat(
                        article['publishedAt'].replace('Z', '+00:00')
                    ),
                    'ticker': tickers[0] if tickers else None,
                    'tickers': tickers
                }
                processed_articles.append(processed_article)
            
            return processed_articles
            
        except Exception as e:
            logger.error(f"General market news fetch failed: {e}")
            return []