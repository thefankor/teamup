from contextlib import asynccontextmanager

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from src.api import router
from src.api.seo import router as seo_router
from src.config import settings
from src.core.db.database import engine
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


@app.get("/health", tags=["Health"])
async def healthcheck():
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,
        )
        await redis_client.ping()
        await redis_client.aclose()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Service unavailable") from exc

    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
