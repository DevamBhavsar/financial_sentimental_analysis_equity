from fastapi import FastAPI
import strawberry
from strawberry.asgi import GraphQL

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@strawberry.type
class User:
    id: int
    username: str
    password: str


@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Hello Worldssssss"

    @strawberry.field
    def get_user(self, id: int) -> User:
        return User(id=id, username="John Doe", password="password")


schema = strawberry.Schema(query=Query)
graphql_app = GraphQL(schema)
app.mount("/graphql", graphql_app)
