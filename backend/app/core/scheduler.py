import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

log = logging.getLogger(__name__)

# Shared AsyncIO scheduler instance for background jobs across the app
scheduler = AsyncIOScheduler()
