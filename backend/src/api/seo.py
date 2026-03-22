from html import escape
from urllib.parse import urljoin

from fastapi import APIRouter, Depends, Response
from fastapi.responses import PlainTextResponse
from src.config import settings
from src.services.project import ProjectService

router = APIRouter(tags=["SEO"])

SITEMAP_BATCH_SIZE = 500


def _strip_trailing_slash(value: str) -> str:
    return value.rstrip("/")


def _absolute_url(base_url: str, path: str) -> str:
    normalized_base = f"{_strip_trailing_slash(base_url)}/"
    normalized_path = path.lstrip("/")
    return urljoin(normalized_base, normalized_path)


def _xml_url_entry(loc: str, lastmod: str | None = None, priority: str | None = None) -> str:
    parts = [f"<loc>{escape(loc)}</loc>"]
    if lastmod:
        parts.append(f"<lastmod>{escape(lastmod)}</lastmod>")
    if priority:
        parts.append(f"<priority>{priority}</priority>")
    return f"<url>{''.join(parts)}</url>"


@router.get("/robots.txt", include_in_schema=False, response_class=PlainTextResponse)
async def robots_txt() -> str:
    sitemap_url = _absolute_url(settings.PUBLIC_API_URL, "/sitemap.xml")
    rules = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /api/v1/auth",
        "Disallow: /api/v1/user",
        "Disallow: /api/v1/notifications",
        "Disallow: /login",
        "Disallow: /profile",
        "Disallow: /notifications",
        "Disallow: /user/",
        "Disallow: /my-projects",
        "Disallow: /projects/new",
        "Disallow: /projects/*/responses",
        f"Sitemap: {sitemap_url}",
    ]
    return "\n".join(rules)


@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml(service: ProjectService = Depends()) -> Response:
    public_site_url = _strip_trailing_slash(settings.PUBLIC_SITE_URL)
    static_entries = [
        _xml_url_entry(_absolute_url(public_site_url, "/"), priority="1.0"),
        _xml_url_entry(_absolute_url(public_site_url, "/search"), priority="0.8"),
    ]

    project_entries: list[str] = []
    offset = 0
    total = None

    while total is None or offset < total:
        page = await service.list_open_projects(limit=SITEMAP_BATCH_SIZE, offset=offset)
        total = page.total or 0

        for project in page.items:
            project_entries.append(
                _xml_url_entry(
                    _absolute_url(public_site_url, f"/projects/{project.id}"),
                    lastmod=project.created_at.date().isoformat(),
                    priority="0.7",
                )
            )

        if not page.items:
            break

        offset += SITEMAP_BATCH_SIZE

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{''.join(static_entries)}{''.join(project_entries)}"
        "</urlset>"
    )
    return Response(content=xml, media_type="application/xml")
