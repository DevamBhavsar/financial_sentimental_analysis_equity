from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
# 1. Import GraphQLRouter from strawberry.fastapi
from strawberry.fastapi import GraphQLRouter
from .graphql_api.schema import schema
from .database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

origins = [
    "http://localhost:3000",  # Frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


async def get_context(request: Request, db: AsyncSession = Depends(get_db)):
    return {
        "request": request,
        "db": db,
    }

# 2. Instantiate GraphQLRouter with your schema and context_getter
graphql_app = GraphQLRouter(schema, context_getter=get_context)

# 3. Include the router in your FastAPI app
app.include_router(graphql_app, prefix="/graphql")