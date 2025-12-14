import os
import httpx
from typing import List, Optional
from pydantic import BaseModel


class TrelloBoard(BaseModel):
    id: str
    name: str


class TrelloList(BaseModel):
    id: str
    name: str


class TrelloCard(BaseModel):
    id: str
    name: str
    desc: str = ""
    labels: List[str] = []
    size_label: Optional[str] = None


class TrelloService:
    """Service for interacting with Trello API"""
    
    BASE_URL = "https://api.trello.com/1"

    def __init__(self):
        self.api_key = os.getenv("TRELLO_API_KEY", "")
        self.token = os.getenv("TRELLO_TOKEN", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.token)

    def _auth_params(self) -> dict:
        return {"key": self.api_key, "token": self.token}

    async def get_boards(self) -> List[TrelloBoard]:
        if not self.is_configured:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/members/me/boards",
                params={**self._auth_params(), "fields": "id,name"}
            )
            if response.status_code != 200:
                return []

            boards = response.json()
            return [TrelloBoard(id=b["id"], name=b["name"]) for b in boards]

    async def get_lists(self, board_id: str) -> List[TrelloList]:
        if not self.is_configured:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/boards/{board_id}/lists",
                params={**self._auth_params(), "fields": "id,name"}
            )
            if response.status_code != 200:
                return []

            lists = response.json()
            return [TrelloList(id=l["id"], name=l["name"]) for l in lists]

    async def get_cards(
        self,
        board_id: str,
        list_id: Optional[str] = None,
        filter_label: Optional[str] = None
    ) -> List[TrelloCard]:
        if not self.is_configured:
            return []

        endpoint = f"{self.BASE_URL}/lists/{list_id}/cards" if list_id else f"{self.BASE_URL}/boards/{board_id}/cards"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                endpoint,
                params={**self._auth_params(), "fields": "id,name,desc,labels"}
            )
            if response.status_code != 200:
                return []

            cards_data = response.json()
            cards = []
            
            for c in cards_data:
                label_names = [label.get("name", "") for label in c.get("labels", [])]
                
                if filter_label and filter_label not in label_names:
                    continue
                
                size_label = self._extract_size_label(label_names)
                
                cards.append(TrelloCard(
                    id=c["id"],
                    name=c["name"],
                    desc=c.get("desc", ""),
                    labels=label_names,
                    size_label=size_label
                ))
            
            return cards

    def _extract_size_label(self, labels: List[str]) -> Optional[str]:
        size_labels = ["2-XS", "XS", "S", "M", "L", "XL", "2-XL", "3-XL"]
        for label in labels:
            if label.upper() in [s.upper() for s in size_labels]:
                return label.upper()
        return None


trello_service = TrelloService()
