from __future__ import annotations

import logging


def configure_logging() -> None:
    """Align app logs with uvicorn's INFO formatting when possible."""
    root_logger = logging.getLogger()
    uvicorn_logger = logging.getLogger("uvicorn.error")

    if not root_logger.handlers and uvicorn_logger.handlers:
        for handler in uvicorn_logger.handlers:
            root_logger.addHandler(handler)
        root_logger.setLevel(logging.INFO)
        return

    if not root_logger.handlers:
        logging.basicConfig(level=logging.INFO, format="INFO:     %(message)s")
    if root_logger.level > logging.INFO:
        root_logger.setLevel(logging.INFO)
