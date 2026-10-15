import sqlite3
import os
import json
import math
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "inspections.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS points in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)

def calculate_eta_minutes(distance_km: float, speed_kmh: float = 25.0) -> int:
    """Calculates realistic driving ETA in minutes assuming average city speed of 25 km/h."""
    if distance_km <= 0.05:
        return 1
    hours = distance_km / speed_kmh
    # Add 2 min for traffic/intersections
    return max(1, int(round(hours * 60)) + 2)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Inspections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        product_category TEXT NOT NULL,
        damage_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        confidence REAL NOT NULL,
        damage_location TEXT NOT NULL,
        bbox_json TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        original_image TEXT NOT NULL,
        visualization_image TEXT NOT NULL,
        heatmap_image TEXT,
        details_json TEXT
    );
    """)

    # 2. Rapido-Style Worker Navigation & Live Tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_locations (
        job_id TEXT PRIMARY KEY,
        worker_id TEXT,
        customer_id TEXT,
        customer_lat REAL,
        customer_lng REAL,
        customer_address TEXT,
        worker_lat REAL,
        worker_lng REAL,
        status TEXT NOT NULL DEFAULT 'assigned',
        is_sharing_location INTEGER NOT NULL DEFAULT 0,
        eta_minutes INTEGER,
        distance_km REAL,
        updated_at TEXT NOT NULL
    );
    """)

    # 3. Customer-Controlled Bidding ON/OFF Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_bidding_settings (
        job_id TEXT PRIMARY KEY,
        customer_id TEXT,
        allow_bidding INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 4. Real Worker and Customer Verification Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT,
        role TEXT NOT NULL DEFAULT 'worker',
        document_type TEXT NOT NULL,
        document_number_masked TEXT NOT NULL,
        document_hash TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        risk_level TEXT NOT NULL DEFAULT 'low',
        failure_reason TEXT,
        provider_status TEXT NOT NULL DEFAULT 'compliance_verified',
        provider_ref TEXT,
        admin_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 5. Verification Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_audit_logs (
        id TEXT PRIMARY KEY,
        verification_id TEXT NOT NULL,
        actor_id TEXT,
        action TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT NOT NULL,
        notes TEXT,
        timestamp TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

# ---------------------------------------------------------------------------
# Inspections CRUD
# ---------------------------------------------------------------------------
def save_inspection(record: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO inspections (
        id, timestamp, product_category, damage_type, severity, confidence,
        damage_location, bbox_json, recommended_action, original_image,
        visualization_image, heatmap_image, details_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["id"],
        record.get("timestamp", datetime.utcnow().isoformat()),
        record["product_category"],
        record["damage_type"],
        record["severity"],
        record["confidence"],
        record["damage_location"],
        json.dumps(record.get("bbox", {})),
        record["recommended_action"],
        record["original_image"],
        record["visualization_image"],
        record.get("heatmap_image", ""),
        json.dumps(record.get("details", {}))
    ))
    conn.commit()
    conn.close()

def get_inspections(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inspections ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "timestamp": row["timestamp"],
            "product_category": row["product_category"],
            "damage_type": row["damage_type"],
            "severity": row["severity"],
            "confidence": row["confidence"],
            "damage_location": row["damage_location"],
            "bbox": json.loads(row["bbox_json"]) if row["bbox_json"] else {},
            "recommended_action": row["recommended_action"],
            "original_image": row["original_image"],
            "visualization_image": row["visualization_image"],
            "heatmap_image": row["heatmap_image"],
            "details": json.loads(row["details_json"]) if row["details_json"] else {}
        })
    conn.close()
    return results

def delete_inspection(inspection_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM inspections WHERE id = ?", (inspection_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# ---------------------------------------------------------------------------
# 1. Rapido-Style Worker Navigation & Live Tracking
# ---------------------------------------------------------------------------
def set_or_init_job_location(
    job_id: str,
    customer_id: str,
    customer_lat: float,
    customer_lng: float,
    customer_address: str,
    worker_id: Optional[str] = None
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    cursor.execute("SELECT * FROM job_locations WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()

    if row:
        cursor.execute("""
        UPDATE job_locations SET
            customer_lat = ?,
            customer_lng = ?,
            customer_address = ?,
            worker_id = COALESCE(?, worker_id),
            updated_at = ?
        WHERE job_id = ?
        """, (customer_lat, customer_lng, customer_address, worker_id, now, job_id))
    else:
        cursor.execute("""
        INSERT INTO job_locations (
            job_id, worker_id, customer_id, customer_lat, customer_lng,
            customer_address, status, is_sharing_location, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'assigned', 0, ?)
        """, (job_id, worker_id, customer_id, customer_lat, customer_lng, customer_address, now))

    conn.commit()
    conn.close()
    return get_job_location(job_id)

def update_worker_live_location(
    job_id: str,
    worker_id: str,
    worker_lat: float,
    worker_lng: float,
    is_sharing: bool = True
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    cursor.execute("SELECT * FROM job_locations WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise ValueError(f"Job location record for {job_id} not found.")

    cust_lat = row["customer_lat"]
    cust_lng = row["customer_lng"]

    distance_km = haversine_km(worker_lat, worker_lng, cust_lat, cust_lng) if cust_lat and cust_lng else None
    eta_min = calculate_eta_minutes(distance_km) if distance_km is not None else None

    # If worker is very close (< 100 meters) and status was on_the_way, can auto-indicate arrived
    current_status = row["status"]
    if current_status == "on_the_way" and distance_km is not None and distance_km <= 0.1:
        current_status = "arrived"

    cursor.execute("""
    UPDATE job_locations SET
        worker_id = ?,
        worker_lat = ?,
        worker_lng = ?,
        is_sharing_location = ?,
        distance_km = ?,
        eta_minutes = ?,
        status = ?,
        updated_at = ?
    WHERE job_id = ?
    """, (worker_id, worker_lat, worker_lng, 1 if is_sharing else 0, distance_km, eta_min, current_status, now, job_id))

    conn.commit()
    conn.close()
    return get_job_location(job_id)

def update_job_journey_status(
    job_id: str,
    worker_id: str,
    new_status: str
) -> Dict[str, Any]:
    valid_statuses = {"assigned", "on_the_way", "arrived", "work_started", "completed", "cancelled"}
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status: {new_status}. Must be one of {valid_statuses}")

    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    # Automatically disable live location sharing if completed or cancelled
    stop_sharing = 1 if new_status in {"completed", "cancelled"} else 0

    cursor.execute("""
    UPDATE job_locations SET
        status = ?,
        is_sharing_location = CASE WHEN ? = 1 THEN 0 ELSE is_sharing_location END,
        updated_at = ?
    WHERE job_id = ?
    """, (new_status, stop_sharing, now, job_id))

    conn.commit()
    conn.close()
    return get_job_location(job_id)

def get_job_location(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM job_locations WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "job_id": row["job_id"],
        "worker_id": row["worker_id"],
        "customer_id": row["customer_id"],
        "customer_lat": row["customer_lat"],
        "customer_lng": row["customer_lng"],
        "customer_address": row["customer_address"],
        "worker_lat": row["worker_lat"],
        "worker_lng": row["worker_lng"],
        "status": row["status"],
        "is_sharing_location": bool(row["is_sharing_location"]),
        "eta_minutes": row["eta_minutes"],
        "distance_km": row["distance_km"],
        "updated_at": row["updated_at"],
    }

def stop_tracking_session(job_id: str, worker_id: Optional[str] = None) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    UPDATE job_locations SET
        is_sharing_location = 0,
        updated_at = ?
    WHERE job_id = ?
    """, (now, job_id))
    conn.commit()
    conn.close()
    return True

# ---------------------------------------------------------------------------
# 2. Customer-Controlled Bidding ON/OFF Settings
# ---------------------------------------------------------------------------
def set_bidding_preference(job_id: str, customer_id: str, allow_bidding: bool) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    cursor.execute("SELECT * FROM job_bidding_settings WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()

    val = 1 if allow_bidding else 0
    if row:
        cursor.execute("""
        UPDATE job_bidding_settings SET
            allow_bidding = ?,
            updated_at = ?
        WHERE job_id = ?
        """, (val, now, job_id))
    else:
        cursor.execute("""
        INSERT INTO job_bidding_settings (
            job_id, customer_id, allow_bidding, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        """, (job_id, customer_id, val, now, now))

    conn.commit()
    conn.close()
    return {
        "job_id": job_id,
        "customer_id": customer_id,
        "allow_bidding": allow_bidding,
        "updated_at": now
    }

def get_bidding_preference(job_id: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM job_bidding_settings WHERE job_id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        # Default to Bidding ON (1) if not explicitly set
        return {
            "job_id": job_id,
            "allow_bidding": True,
            "is_default": True
        }

    return {
        "job_id": row["job_id"],
        "customer_id": row["customer_id"],
        "allow_bidding": bool(row["allow_bidding"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }

# ---------------------------------------------------------------------------
# 3. Real Worker and Customer Verification System
# ---------------------------------------------------------------------------
def check_duplicate_document(doc_hash: str, exclude_user_id: Optional[str] = None) -> bool:
    """Checks if the document hash was already registered by another account."""
    if not doc_hash:
        return False
    conn = get_connection()
    cursor = conn.cursor()
    if exclude_user_id:
        cursor.execute("""
        SELECT COUNT(*) as count FROM verification_records
        WHERE document_hash = ? AND user_id != ? AND status IN ('verified', 'pending', 'requires_review')
        """, (doc_hash, exclude_user_id))
    else:
        cursor.execute("""
        SELECT COUNT(*) as count FROM verification_records
        WHERE document_hash = ? AND status IN ('verified', 'pending', 'requires_review')
        """, (doc_hash,))
    row = cursor.fetchone()
    conn.close()
    return (row["count"] > 0) if row else False

def submit_verification_request(
    user_id: str,
    user_name: str,
    role: str,
    document_type: str,
    document_number_masked: str,
    document_hash: str,
    status: str = "pending",
    risk_level: str = "low",
    failure_reason: Optional[str] = None,
    provider_status: str = "compliance_verified",
    admin_notes: Optional[str] = None
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    rec_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # Check for existing record
    cursor.execute("SELECT id FROM verification_records WHERE user_id = ? AND document_type = ?", (user_id, document_type))
    existing = cursor.fetchone()

    if existing:
        rec_id = existing["id"]
        cursor.execute("""
        UPDATE verification_records SET
            user_name = ?,
            role = ?,
            document_number_masked = ?,
            document_hash = ?,
            status = ?,
            risk_level = ?,
            failure_reason = ?,
            provider_status = ?,
            admin_notes = ?,
            updated_at = ?
        WHERE id = ?
        """, (user_name, role, document_number_masked, document_hash, status,
              risk_level, failure_reason, provider_status, admin_notes, now, rec_id))
    else:
        cursor.execute("""
        INSERT INTO verification_records (
            id, user_id, user_name, role, document_type, document_number_masked,
            document_hash, status, risk_level, failure_reason, provider_status,
            provider_ref, admin_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (rec_id, user_id, user_name, role, document_type, document_number_masked,
              document_hash, status, risk_level, failure_reason, provider_status,
              f"NW-{uuid.uuid4().hex[:8].upper()}", admin_notes, now, now))

    # Add audit log
    audit_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO verification_audit_logs (
        id, verification_id, actor_id, action, previous_status, new_status, notes, timestamp
    ) VALUES (?, ?, ?, 'submission', 'none', ?, ?, ?)
    """, (audit_id, rec_id, user_id, status, f"Submitted {document_type}", now))

    conn.commit()
    conn.close()

    return get_verification_record(rec_id)

def get_verification_record(rec_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM verification_records WHERE id = ?", (rec_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def get_user_verification(user_id: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM verification_records
    WHERE user_id = ?
    ORDER BY updated_at DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {
            "user_id": user_id,
            "status": "not_verified",
            "is_verified": False,
            "documents": []
        }

    docs = [dict(r) for r in rows]
    # Check if any document is verified
    is_verified = any(d["status"] == "verified" for d in docs)
    # Overall status: verified > requires_review > pending > failed > not_verified
    if is_verified:
        overall_status = "verified"
    elif any(d["status"] == "requires_review" for d in docs):
        overall_status = "requires_review"
    elif any(d["status"] == "pending" for d in docs):
        overall_status = "pending"
    elif any(d["status"] == "failed" for d in docs):
        overall_status = "failed"
    else:
        overall_status = "not_verified"

    return {
        "user_id": user_id,
        "status": overall_status,
        "is_verified": is_verified,
        "documents": docs
    }

def get_admin_verification_list(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if status_filter and status_filter != "all":
        cursor.execute("""
        SELECT * FROM verification_records
        WHERE status = ?
        ORDER BY updated_at DESC
        """, (status_filter,))
    else:
        cursor.execute("SELECT * FROM verification_records ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def admin_review_verification_record(
    rec_id: str,
    actor_id: str,
    action: str,
    admin_notes: Optional[str] = None
) -> Dict[str, Any]:
    valid_actions = {"approve", "reject", "request_review"}
    if action not in valid_actions:
        raise ValueError(f"Invalid action: {action}. Must be one of {valid_actions}")

    new_status = {
        "approve": "verified",
        "reject": "failed",
        "request_review": "requires_review"
    }[action]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM verification_records WHERE id = ?", (rec_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Verification record {rec_id} not found.")

    prev_status = row["status"]
    now = datetime.utcnow().isoformat()

    cursor.execute("""
    UPDATE verification_records SET
        status = ?,
        admin_notes = ?,
        updated_at = ?
    WHERE id = ?
    """, (new_status, admin_notes, now, rec_id))

    # Record audit log
    audit_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO verification_audit_logs (
        id, verification_id, actor_id, action, previous_status, new_status, notes, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (audit_id, rec_id, actor_id, f"admin_{action}", prev_status, new_status, admin_notes, now))

    conn.commit()
    conn.close()

    return get_verification_record(rec_id)

# Initialize immediately
init_db()

# ---------------------------------------------------------------------------
# 6. Marketplace Jobs Fallback / Demo Persistence
# ---------------------------------------------------------------------------
def init_marketplace_jobs_table():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS marketplace_jobs (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        service TEXT,
        budget_min INTEGER,
        budget_max INTEGER,
        is_negotiable INTEGER DEFAULT 1,
        is_instant INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        location_name TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        accepted_worker_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

init_marketplace_jobs_table()

def save_marketplace_job(record: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    job_id = record.get("id") or str(uuid.uuid4())

    cursor.execute("""
    INSERT OR REPLACE INTO marketplace_jobs (
        id, customer_id, customer_name, title, description, category, service,
        budget_min, budget_max, is_negotiable, is_instant, latitude, longitude,
        location_name, status, accepted_worker_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job_id,
        record.get("customer_id", "demo-customer"),
        record.get("customer_name", "Customer"),
        record.get("title", ""),
        record.get("description", ""),
        record.get("category", "other"),
        record.get("service", ""),
        record.get("budget_min", 0),
        record.get("budget_max", 0),
        1 if record.get("is_negotiable", True) else 0,
        1 if record.get("is_instant", False) else 0,
        record.get("latitude", 13.0827),
        record.get("longitude", 80.2707),
        record.get("location_name", "Customer location"),
        record.get("status", "open"),
        record.get("accepted_worker_id"),
        record.get("created_at", now),
        now
    ))
    conn.commit()
    conn.close()
    return get_marketplace_job(job_id)

def get_marketplace_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM marketplace_jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    res = dict(row)
    res["is_negotiable"] = bool(res["is_negotiable"])
    res["is_instant"] = bool(res["is_instant"])
    return res

def list_marketplace_jobs(customer_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM marketplace_jobs WHERE 1=1"
    params = []
    if customer_id:
        query += " AND customer_id = ?"
        params.append(customer_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        d["is_negotiable"] = bool(d["is_negotiable"])
        d["is_instant"] = bool(d["is_instant"])
        res.append(d)
    return res
