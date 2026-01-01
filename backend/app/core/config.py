
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from sqlalchemy import URL


class AppConfig(BaseModel):
	name: str = "IMVU Insight API"
	env: str = "dev"
	api_v1_prefix: str = "/api/v1"
	root_path: str = ""


class MySQLConfig(BaseModel):
	host: str = "127.0.0.1"
	port: int = 3306
	user: str = "root"
	password: str = ""
	db: str = "imvu_insight"
	echo: bool = False


class Settings(BaseModel):
	app: AppConfig = Field(default_factory=AppConfig)
	mysql: MySQLConfig = Field(default_factory=MySQLConfig)

	@property
	def sqlalchemy_database_uri(self) -> str:
		return str(
			URL.create(
				drivername="mysql+asyncmy",
				username=self.mysql.user,
				password=self.mysql.password or None,
				host=self.mysql.host,
				port=self.mysql.port,
				database=self.mysql.db,
			)
		)


def _backend_root() -> Path:
	# backend/app/core/config.py -> parents[2] == backend/
	return Path(__file__).resolve().parents[2]


def _resolve_config_path() -> Path:
	root = _backend_root()
	config_dir = root / "config"

	# Optional override (kept minimal; config values still come from files)
	override = os.getenv("IMVU_CONFIG_PATH")
	if override:
		return Path(override).expanduser().resolve()

	# Convention: config/config.yaml is the active config.
	active = config_dir / "config.yaml"
	if active.exists():
		return active

	# Fallback for local development
	return config_dir / "config.dev.yaml"


def _load_yaml(path: Path) -> dict[str, Any]:
	if not path.exists():
		raise FileNotFoundError(f"Config file not found: {path}")

	content = path.read_text(encoding="utf-8").strip()
	if not content:
		return {}

	data = yaml.safe_load(content)
	if data is None:
		return {}
	if not isinstance(data, dict):
		raise ValueError(f"Invalid YAML root type in {path}. Expected a mapping/object.")
	return data


@lru_cache
def get_settings() -> Settings:
	config_path = _resolve_config_path()
	data = _load_yaml(config_path)
	return Settings.model_validate(data)

