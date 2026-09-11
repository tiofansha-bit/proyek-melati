from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, date


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PIN = os.environ.get('ADMIN_PIN', '1234')

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ------------------------- Models -------------------------
class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    avatar_url: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class EmployeeCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None


class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class ActivityCreate(BaseModel):
    name: str


LeaveType = Literal["sakit", "cuti", "izin"]
StatusType = Literal["pending", "approved", "rejected"]


class Leave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    type: LeaveType
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    notes: Optional[str] = ""
    status: StatusType = "pending"
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class LeaveCreate(BaseModel):
    employee_id: str
    type: LeaveType
    start_date: str
    end_date: str
    notes: Optional[str] = ""
    status: Optional[StatusType] = "pending"


class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    activity_name: str
    date: str  # YYYY-MM-DD
    location: str
    notes: Optional[str] = ""
    status: StatusType = "pending"
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class ActivityLogCreate(BaseModel):
    employee_id: str
    activity_name: str
    date: str
    location: str
    notes: Optional[str] = ""
    status: Optional[StatusType] = "pending"


class StatusUpdate(BaseModel):
    status: StatusType


class AdminLogin(BaseModel):
    pin: str


NO_ID = {"_id": 0}


async def get_employee(employee_id: str) -> Optional[dict]:
    return await db.employees.find_one({"id": employee_id, "deleted_at": None}, NO_ID)


# ------------------------- Auth -------------------------
@api_router.post("/admin/login")
async def admin_login(payload: AdminLogin):
    if payload.pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="PIN salah")
    return {"ok": True}


# ------------------------- Employees -------------------------
@api_router.get("/employees", response_model=List[Employee])
async def list_employees():
    docs = await db.employees.find({"deleted_at": None}, NO_ID).sort("name", 1).to_list(1000)
    return [Employee(**d) for d in docs]


@api_router.post("/employees", response_model=Employee)
async def create_employee(payload: EmployeeCreate):
    emp = Employee(name=payload.name.strip(), avatar_url=payload.avatar_url)
    await db.employees.insert_one(emp.dict())
    return emp


@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    res = await db.employees.update_one(
        {"id": employee_id, "deleted_at": None}, {"$set": {"deleted_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pegawai tidak ditemukan")
    return {"ok": True}


# ------------------------- Activities (master) -------------------------
@api_router.get("/activities", response_model=List[Activity])
async def list_activities():
    docs = await db.activities.find({"deleted_at": None}, NO_ID).sort("name", 1).to_list(1000)
    return [Activity(**d) for d in docs]


@api_router.post("/activities", response_model=Activity)
async def create_activity(payload: ActivityCreate):
    act = Activity(name=payload.name.strip())
    await db.activities.insert_one(act.dict())
    return act


@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str):
    res = await db.activities.update_one(
        {"id": activity_id, "deleted_at": None}, {"$set": {"deleted_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kegiatan tidak ditemukan")
    return {"ok": True}


# ------------------------- Leaves (izin) -------------------------
@api_router.get("/leaves", response_model=List[Leave])
async def list_leaves(employee_id: Optional[str] = None, status: Optional[str] = None):
    q: dict = {"deleted_at": None}
    if employee_id:
        q["employee_id"] = employee_id
    if status:
        q["status"] = status
    docs = await db.leaves.find(q, NO_ID).sort("created_at", -1).to_list(2000)
    return [Leave(**d) for d in docs]


@api_router.post("/leaves", response_model=Leave)
async def create_leave(payload: LeaveCreate):
    emp = await get_employee(payload.employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Pegawai tidak ditemukan")
    leave = Leave(
        employee_id=payload.employee_id,
        employee_name=emp["name"],
        type=payload.type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes or "",
        status=payload.status or "pending",
    )
    await db.leaves.insert_one(leave.dict())
    return leave


@api_router.patch("/leaves/{leave_id}/status", response_model=Leave)
async def update_leave_status(leave_id: str, payload: StatusUpdate):
    res = await db.leaves.update_one(
        {"id": leave_id, "deleted_at": None}, {"$set": {"status": payload.status}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Izin tidak ditemukan")
    doc = await db.leaves.find_one({"id": leave_id}, NO_ID)
    return Leave(**doc)


@api_router.delete("/leaves/{leave_id}")
async def delete_leave(leave_id: str):
    res = await db.leaves.update_one(
        {"id": leave_id, "deleted_at": None}, {"$set": {"deleted_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Izin tidak ditemukan")
    return {"ok": True}


# ------------------------- Activity logs (kegiatan luar) -------------------------
@api_router.get("/activity-logs", response_model=List[ActivityLog])
async def list_activity_logs(employee_id: Optional[str] = None, status: Optional[str] = None):
    q: dict = {"deleted_at": None}
    if employee_id:
        q["employee_id"] = employee_id
    if status:
        q["status"] = status
    docs = await db.activity_logs.find(q, NO_ID).sort("created_at", -1).to_list(2000)
    return [ActivityLog(**d) for d in docs]


@api_router.post("/activity-logs", response_model=ActivityLog)
async def create_activity_log(payload: ActivityLogCreate):
    emp = await get_employee(payload.employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Pegawai tidak ditemukan")
    log = ActivityLog(
        employee_id=payload.employee_id,
        employee_name=emp["name"],
        activity_name=payload.activity_name,
        date=payload.date,
        location=payload.location,
        notes=payload.notes or "",
        status=payload.status or "pending",
    )
    await db.activity_logs.insert_one(log.dict())
    return log


@api_router.patch("/activity-logs/{log_id}/status", response_model=ActivityLog)
async def update_activity_log_status(log_id: str, payload: StatusUpdate):
    res = await db.activity_logs.update_one(
        {"id": log_id, "deleted_at": None}, {"$set": {"status": payload.status}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kegiatan tidak ditemukan")
    doc = await db.activity_logs.find_one({"id": log_id}, NO_ID)
    return ActivityLog(**doc)


@api_router.delete("/activity-logs/{log_id}")
async def delete_activity_log(log_id: str):
    res = await db.activity_logs.update_one(
        {"id": log_id, "deleted_at": None}, {"$set": {"deleted_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kegiatan tidak ditemukan")
    return {"ok": True}


# ------------------------- Pending (admin dashboard) -------------------------
@api_router.get("/pending")
async def get_pending():
    leaves = await db.leaves.find({"deleted_at": None, "status": "pending"}, NO_ID).sort("created_at", -1).to_list(1000)
    logs = await db.activity_logs.find({"deleted_at": None, "status": "pending"}, NO_ID).sort("created_at", -1).to_list(1000)
    return {
        "leaves": [Leave(**d).dict() for d in leaves],
        "activities": [ActivityLog(**d).dict() for d in logs],
    }


# ------------------------- Reports -------------------------
def _days_between(start: str, end: str) -> int:
    try:
        s = date.fromisoformat(start)
        e = date.fromisoformat(end)
        delta = (e - s).days + 1
        return max(delta, 1)
    except Exception:
        return 1


def _in_period(date_str: str, year: Optional[int], month: Optional[int]) -> bool:
    if year is None and month is None:
        return True
    try:
        d = date.fromisoformat(date_str)
    except Exception:
        return False
    if year is not None and d.year != year:
        return False
    if month is not None and d.month != month:
        return False
    return True


@api_router.get("/reports/absences")
async def report_absences(year: Optional[int] = None, month: Optional[int] = None):
    """Jumlah tidak hadir masuk kerja (hari) per pegawai — dari izin approved."""
    employees = await db.employees.find({"deleted_at": None}, NO_ID).to_list(1000)
    leaves = await db.leaves.find({"deleted_at": None, "status": "approved"}, NO_ID).to_list(5000)
    leaves = [lv for lv in leaves if _in_period(lv["start_date"], year, month)]
    by_emp: dict = {}
    for lv in leaves:
        eid = lv["employee_id"]
        by_emp.setdefault(eid, {"count": 0, "days": 0})
        by_emp[eid]["count"] += 1
        by_emp[eid]["days"] += _days_between(lv["start_date"], lv["end_date"])
    result = []
    for emp in employees:
        stat = by_emp.get(emp["id"], {"count": 0, "days": 0})
        result.append({
            "employee_id": emp["id"],
            "name": emp["name"],
            "avatar_url": emp.get("avatar_url"),
            "count": stat["count"],
            "days": stat["days"],
        })
    result.sort(key=lambda x: (-x["days"], x["name"]))
    return result


@api_router.get("/reports/activities")
async def report_activities(year: Optional[int] = None, month: Optional[int] = None):
    """Jumlah kegiatan luar per pegawai — dari kegiatan approved."""
    employees = await db.employees.find({"deleted_at": None}, NO_ID).to_list(1000)
    logs = await db.activity_logs.find({"deleted_at": None, "status": "approved"}, NO_ID).to_list(5000)
    logs = [lg for lg in logs if _in_period(lg["date"], year, month)]
    by_emp: dict = {}
    for lg in logs:
        eid = lg["employee_id"]
        by_emp.setdefault(eid, 0)
        by_emp[eid] += 1
    result = []
    for emp in employees:
        result.append({
            "employee_id": emp["id"],
            "name": emp["name"],
            "avatar_url": emp.get("avatar_url"),
            "count": by_emp.get(emp["id"], 0),
        })
    result.sort(key=lambda x: (-x["count"], x["name"]))
    return result


@api_router.get("/")
async def root():
    return {"message": "Manajemen Izin & Kegiatan Pegawai API"}


# ------------------------- Seed -------------------------
SEED_AVATARS = [
    "https://images.unsplash.com/photo-1758691737605-69a0e78bd193?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBhc2lhbiUyMG9mZmljZSUyMHdvcmtlciUyMHBvcnRyYWl0fGVufDB8fHx8MTc4OTA5Mjg1NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1544168190-79c17527004f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhc2lhbiUyMG9mZmljZSUyMHdvcmtlciUyMHBvcnRyYWl0fGVufDB8fHx8MTc4OTA5Mjg1NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBhc2lhbiUyMG9mZmljZSUyMHdvcmtlciUyMHBvcnRyYWl0fGVufDB8fHx8MTc4OTA5Mjg1NXww&ixlib=rb-4.1.0&q=85",
]


@app.on_event("startup")
async def seed_data():
    if await db.employees.count_documents({}) == 0:
        names = ["Andi Saputra", "Siti Rahayu", "Budi Santoso", "Dewi Lestari"]
        for i, name in enumerate(names):
            emp = Employee(name=name, avatar_url=SEED_AVATARS[i % len(SEED_AVATARS)])
            await db.employees.insert_one(emp.dict())
    if await db.activities.count_documents({}) == 0:
        for name in ["Rapat Klien", "Survei Lapangan", "Pelatihan Eksternal", "Kunjungan Dinas"]:
            await db.activities.insert_one(Activity(name=name).dict())


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
