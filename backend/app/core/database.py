from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, DateTime, Text, text
from datetime import datetime, timezone
from backend.app.core.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


def utc_now():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255))
    label: Mapped[str] = mapped_column(String(20))
    confidence: Mapped[float] = mapped_column(Float)
    prob_authentic: Mapped[float] = mapped_column(Float)
    prob_forged: Mapped[float] = mapped_column(Float)
    ela_path: Mapped[str] = mapped_column(String(500), nullable=True)
    heatmap_path: Mapped[str] = mapped_column(String(500), nullable=True)
    noise_path: Mapped[str] = mapped_column(String(500), nullable=True)
    mask_path: Mapped[str] = mapped_column(String(500), nullable=True)
    sha256: Mapped[str] = mapped_column(String(64), nullable=True)
    tamper_area_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=True)
    severity: Mapped[str] = mapped_column(String(50), default="Clean", nullable=True)
    metrics_json: Mapped[str] = mapped_column(Text, nullable=True)
    regions_json: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migrate existing tables if missing new columns
        for col_name, col_type in [
            ("noise_path", "VARCHAR(500)"),
            ("mask_path", "VARCHAR(500)"),
            ("sha256", "VARCHAR(64)"),
            ("tamper_area_pct", "FLOAT DEFAULT 0.0"),
            ("severity", "VARCHAR(50) DEFAULT 'Clean'"),
            ("metrics_json", "TEXT"),
            ("regions_json", "TEXT"),
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE predictions ADD COLUMN {col_name} {col_type}"))
            except Exception:
                pass  # column already exists


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
