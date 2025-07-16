from fastapi import FastAPI, Depends
from strawberry.fastapi import GraphQLRouter
from .graphql.resolver import schema
from .database import get_db
from .auth import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any


async def get_context(
    db: AsyncSession = Depends(get_db), current_user=Depends(get_current_active_user)
) -> Dict[str, Any]:
    return {"db": db, "current_user": current_user}


app = FastAPI()

# Create GraphQL router with context
graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
)

# Mount GraphQL endpoint
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
async def root():
    return {"message": "Welcome to Financial Sentiment Analysis API"}
