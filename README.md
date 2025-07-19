# Financial Sentiment Analysis for Equity

This is a web application that allows users to track their stock and mutual fund holdings, aggregates financial news related to their portfolio, and performs sentiment analysis on the news to provide investment recommendations.

## Features

* **User Authentication**: Secure user registration and login.
* **Dashboard**: A personalized dashboard to view your holdings and an overview of market sentiment.
* **Upload Holdings**: Easily upload your holdings from an Excel file.
* **News Aggregation**: Fetches the latest financial news related to your investments.
* **Sentiment Analysis**: Analyzes news articles to provide sentiment scores and recommendations (buy, sell, or hold).

## Tech Stack

* **Backend**:
    * Python
    * FastAPI
    * Strawberry (for GraphQL)
    * SQLAlchemy (ORM)
    * PostgreSQL
    * Redis
    * spaCy (for NLP)
    * Hugging Face Transformers (for sentiment analysis)
* **Frontend**:
    * Next.js
    * React
    * Apollo Client (for GraphQL)
    * Tailwind CSS
* **DevOps**:
    * Docker

## Getting Started

### Prerequisites

* Docker and Docker Compose
* Python 3.9+
* Node.js and npm/pnpm/yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/devambhavsar/financial_sentimental_analysis_equity.git](https://github.com/devambhavsar/financial_sentimental_analysis_equity.git)
    cd financial_sentimental_analysis_equity
    ```

2.  **Create a `.env` file** in the root directory and add the following environment variables:
    ```
    DATABASE_URL=postgresql+asyncpg://user:password@db/dbname
    REDIS_URL=redis://redis:6379/0
    JWT_SECRET=your_jwt_secret
    JWT_ALGORITHM=HS256
    EXPIRY_MIN=30
    NEWS_API_KEY=your_news_api_key
    ```

3.  **Create a `.env.local` file** in the `frontend` directory and add the following:
    ```
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

### Running the Application

You can run the application using Docker Compose:

```bash
docker-compose up --build