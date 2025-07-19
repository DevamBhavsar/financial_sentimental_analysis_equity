from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from strawberry.fastapi import GraphQLRouter
from .graphql_api.schema import schema
from .database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from .auth.auth import get_current_user
from .models.user import User as UserModel


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
security = HTTPBearer(auto_error=False)


@app.get("/")
def read_root():
    return {"Hello": "World"}


# async def get_context(request: Request, db: AsyncSession = Depends(get_db)):
#     return {
#         "request": request,
#         "db": db,
#     }
async def get_context(
    request: Request,
    db: AsyncSession = Depends(get_db),
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    current_user: UserModel | None = None
    if creds:
        try:
            current_user = await get_current_user(credentials=creds, db=db)
        except HTTPException:
            current_user = None

    return {
        "request": request,
        "db": db,
        "current_user": current_user,
    }


# 2. Instantiate GraphQLRouter with your schema and context_getter
graphql_app = GraphQLRouter(schema, context_getter=get_context)

# 3. Include the router in your FastAPI app
app.include_router(graphql_app, prefix="/graphql")
