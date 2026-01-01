# app/security/models.py
from dataclasses import dataclass

@dataclass(frozen=True)
class Principal:
    user_id: int
    user_name: str
