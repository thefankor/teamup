from contextlib import asynccontextmanager

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI
from src.api import router
from src.api.seo import router as seo_router
from src.config import settings
from src.core.db.redis_cache import RedisCache, redis_cache, set_cache
from src.utils.s3_service import S3Service
from starlette.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
    )
    cache = RedisCache(client)
    set_cache(cache)
    s3 = S3Service()
    await s3.ensure_bucket()

    yield

    if redis_cache:
        await redis_cache.close()


app = FastAPI(
    title="TeamUp API",
    redirect_slashes=False,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(seo_router)
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
