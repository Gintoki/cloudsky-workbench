from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="CloudSky Data & AI API",
    version="0.1.0",
    description="Phase 1 contract surface. No external provider is enabled by default.",
)


class Citation(BaseModel):
    source_id: str
    quote: str | None = None


class GroundedAnswer(BaseModel):
    answer: str
    answer_type: Literal["fact", "inference", "suggestion", "insufficient"]
    citations: list[Citation] = Field(default_factory=list)
    conflicts: list[str] = Field(default_factory=list)
    provider: str = "mock"


class AuthorizedQuestionContext(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    approved_fact_ids: list[str] = Field(default_factory=list)
    approved_metric_value_ids: list[str] = Field(default_factory=list)
    authorized_chunk_ids: list[str] = Field(default_factory=list)


@app.get("/health/live")
def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
def readiness() -> dict[str, str]:
    return {"status": "ready", "provider": "mock"}


@app.post("/v1/knowledge/answer", response_model=GroundedAnswer)
def answer_question(context: AuthorizedQuestionContext) -> GroundedAnswer:
    """Mock provider: never fabricates an answer when no approved context exists."""
    has_context = bool(
        context.approved_fact_ids
        or context.approved_metric_value_ids
        or context.authorized_chunk_ids
    )
    if not has_context:
        return GroundedAnswer(
            answer="现有资料不足。",
            answer_type="insufficient",
        )
    return GroundedAnswer(
        answer="Mock Provider 已收到授权上下文；Phase 5 配置模型后才会生成基于引用的草稿。",
        answer_type="suggestion",
    )
