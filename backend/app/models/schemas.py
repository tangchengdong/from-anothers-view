from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Perspective(BaseModel):
    id: str
    name: str
    emoji: str
    color: str
    description: str
    subcategories: List[str]


class NewsItem(BaseModel):
    id: int
    title: str
    summary: str
    content: str
    source: str
    category: str
    tags: List[str]
    publish_time: str
    views: int
    image_url: str
    perspective_id: Optional[str] = None
    relevance_score: Optional[float] = None


class FeedResponse(BaseModel):
    perspective: str
    items: List[NewsItem]
    insights: List[str]
    hot_topics: List[str]
    total: int


class StreamEvent(BaseModel):
    event: str  # thinking, item, insight, topic, done
    data: dict = Field(default_factory=dict)
    message: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str
    nickname: str
    avatar: Optional[str] = None
    created_at: str


class UserPreferences(BaseModel):
    default_perspective: Optional[str] = None
    last_subcategory: Optional[str] = None


class InteractionRequest(BaseModel):
    content_id: int
    interaction_type: str  # like, favorite


class SearchResponse(BaseModel):
    query: str
    results: List[NewsItem]
    by_perspective: dict = Field(default_factory=dict)
