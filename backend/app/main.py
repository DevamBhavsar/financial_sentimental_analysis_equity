from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from strawberry.fastapi import GraphQLRouter

# from strawberry.file_uploads import Upload

# Import database dependencies
from .database import get_db
from .models.user import User
from .auth.auth import get_current_user
from .graphql_api.resolver import schema

# Import API routers
from .api.market import router as market_router

# Initialize FastAPI app and security
app = FastAPI()
security = HTTPBearer(auto_error=False)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "apollo-require-preflight",
    ],
)


# Add middleware to handle larger file uploads
@app.middleware("http")
async def add_file_upload_headers(request: Request, call_next):
    response = await call_next(request)

    # Add headers for file upload support
    if request.url.path == "/graphql":
        response.headers["Access-Control-Allow-Headers"] = (
            "Authorization, Content-Type, Accept, Origin, X-Requested-With, apollo-require-preflight"
        )
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    return response


async def get_context(
    request: Request,
    db: AsyncSession = Depends(get_db),
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    current_user: User | None = None
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


# Create GraphQL router with multipart upload support
graphql_app = GraphQLRouter(
    schema, context_getter=get_context, multipart_uploads_enabled=True
)

app.include_router(graphql_app, prefix="/graphql")

# Include API routers
app.include_router(market_router, prefix="/api")

# Add logging configuration
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for more detailed logs
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    pass


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down...")
    pass
