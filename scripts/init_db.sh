#!/bin/bash

# This script is to be run from the root of the project

docker-compose exec backend alembic upgrade head
