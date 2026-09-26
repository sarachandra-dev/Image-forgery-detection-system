from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from backend.app.core.database import get_db, PredictionRecord
from backend.app.schemas.prediction import HistoryItem

router = APIRouter()


@router.get("/history", response_model=List[HistoryItem])
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PredictionRecord)
        .order_by(desc(PredictionRecord.created_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.delete("/history/{record_id}")
async def delete_record(record_id: int, db: AsyncSession = Depends(get_db)):
    record = await db.get(PredictionRecord, record_id)
    if record:
        await db.delete(record)
        await db.commit()
    return {"deleted": record_id}
