from src.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=20)
def send_code_task(self, email: str, code: str):
    try:
        print(email, code)
    except Exception as exc:
        raise self.retry(exc=exc)
