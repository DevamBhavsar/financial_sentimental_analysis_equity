import strawberry
from .resolver import Query, Mutation

schema = strawberry.Schema(query=Query, mutation=Mutation)
