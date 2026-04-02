import uuid

import anyio
import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from src.config import settings


class S3Service:
    def __init__(self):
        self.bucket = settings.S3_BUCKET
        client_kwargs = {
            "aws_access_key_id": settings.S3_ACCESS_KEY,
            "aws_secret_access_key": settings.S3_SECRET_KEY,
            "region_name": settings.S3_REGION,
            "config": BotoConfig(
                signature_version="s3v4",
                request_checksum_calculation="when_required",
                response_checksum_validation="when_required",
            ),
        }

        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            **client_kwargs,
        )
        self._public_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_PUBLIC_HOST or settings.S3_ENDPOINT_URL,
            **client_kwargs,
        )

    async def ensure_bucket(self) -> None:
        """Создать bucket, если его нет."""

        def _sync():
            try:
                self._client.head_bucket(Bucket=self.bucket)
            except ClientError:
                self._client.create_bucket(Bucket=self.bucket)

        await anyio.to_thread.run_sync(_sync)

    async def generate_presigned_upload_url(
        self,
        *,
        user_id: str,
        content_type: str,
        expires_in: int = 600,
    ) -> tuple[str, str]:
        """
        Возвращает:
        - upload_url (для PUT запроса)
        - object_key (который нужно сохранить в БД)
        """

        ext = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }.get(content_type, "")

        object_key = f"users/{user_id}/avatar/{uuid.uuid4().hex}{ext}"

        def _sync():
            url = self._public_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": object_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            return url

        upload_url = await anyio.to_thread.run_sync(_sync)
        return upload_url, object_key

    async def presigned_get_url(
        self,
        *,
        key: str,
        expires_in: int = 60 * 10,
    ) -> str:
        """Pre-signed URL на скачивание/просмотр."""

        def _sync():
            return self._public_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": key,
                },
                ExpiresIn=expires_in,
            )

        return await anyio.to_thread.run_sync(_sync)

    async def delete_object(self, *, key: str) -> None:
        def _sync():
            self._client.delete_object(Bucket=self.bucket, Key=key)

        await anyio.to_thread.run_sync(_sync)
