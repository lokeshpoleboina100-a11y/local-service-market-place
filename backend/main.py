import os
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io

from model import (
    base64_to_image,
    image_to_base64,
    detect_product_category,
    analyze_damage_patterns,
    generate_heatmap_overlay,
    synthesize_damage_visualization,
    device,
)
from database import save_inspection, get_inspections, delete_inspection
from job_analyzer import detect_service_from_multimodal

app = FastAPI(
    title="AI Product Damage Detection & Visualization System",
    description="CNN-based product damage classification, localized damage mapping, and photorealistic visualization.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeBase64Request(BaseModel):
    image: str
    product_category: Optional[str] = None
    notes: Optional[str] = None

class GenerateDamageRequest(BaseModel):
    image: str
    damage_type: Optional[str] = "Cracked Screen"
    severity: Optional[str] = "High"
    bbox: Optional[Dict[str, float]] = None

class AnalyzeJobRequest(BaseModel):
    image: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

def run_damage_pipeline(pil_img: Image.Image) -> Dict[str, Any]:
    # Limit maximum resolution to 1600px for high performance
    max_dim = 1600
    if max(pil_img.size) > max_dim:
        pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    # 1. CNN Product Category Detection
    detected_category, cat_confidence = detect_product_category(pil_img)

    # 2. CNN Damage Feature Extraction & Localization
    damage_analysis = analyze_damage_patterns(pil_img)

    # 3. Generate Grad-CAM Heatmap Overlay
    heatmap_base64 = generate_heatmap_overlay(pil_img, damage_analysis["grad_mag"])

    # 4. Generate AI Realistic Damage Visualization
    visualization_base64 = synthesize_damage_visualization(
        original_img=pil_img,
        bbox=damage_analysis["bbox"],
        damage_type=damage_analysis["damage_type"],
        severity=damage_analysis["severity"]
    )

    original_base64 = image_to_base64(pil_img, format="JPEG")
    record_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    response_data = {
        "id": record_id,
        "timestamp": timestamp,
        "product_category": detected_category,
        "category_confidence": cat_confidence,
        "damage_type": damage_analysis["damage_type"],
        "severity": damage_analysis["severity"],
        "confidence": damage_analysis["confidence"],
        "damage_location": damage_analysis["location"],
        "recommended_action": damage_analysis["action"],
        "bbox": damage_analysis["bbox"],
        "damage_ratio": damage_analysis["damage_ratio"],
        "original_image": original_base64,
        "visualization_image": visualization_base64,
        "heatmap_image": heatmap_base64,
        "verified_by_model": "MobileNetV3 + Deep Fracture Tensor Engine",
        "details": {
            "resolution": f"{pil_img.width}x{pil_img.height}",
            "model_architecture": "CNN MobileNetV3 + Sobel-Laplacian Edge Tensor Filters",
            "inference_device": str(device)
        }
    }

    # Save to SQLite history database
    save_inspection(response_data)
    return response_data

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "AI Product Damage Detection and Visualization System",
        "model": "MobileNetV3 + Multi-Scale Fracture CNN",
        "device": str(device),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/analyze")
async def analyze_product(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
        return run_damage_pipeline(pil_img)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/api/analyze-json")
async def analyze_product_json(payload: AnalyzeBase64Request):
    try:
        pil_img = base64_to_image(payload.image)
        return run_damage_pipeline(pil_img)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/api/generate-damage")
async def generate_damage(payload: GenerateDamageRequest):
    try:
        pil_img = base64_to_image(payload.image)
        bbox = payload.bbox or {"x": 0.25, "y": 0.25, "width": 0.5, "height": 0.5}

        visualization_base64 = synthesize_damage_visualization(
            original_img=pil_img,
            bbox=bbox,
            damage_type=payload.damage_type or "Cracked Screen",
            severity=payload.severity or "High"
        )

        return {
            "status": "success",
            "generated_image": visualization_base64,
            "damage_type": payload.damage_type,
            "severity": payload.severity,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/api/history")
def get_history(limit: int = 25):
    return get_inspections(limit=limit)

@app.delete("/api/history/{inspection_id}")
def delete_history_item(inspection_id: str):
    success = delete_inspection(inspection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    return {"status": "deleted", "id": inspection_id}

@app.post("/api/analyze-job")
async def analyze_job(payload: AnalyzeJobRequest):
    try:
        product_category = None
        damage_type = None
        damage_result = None

        if payload.image and len(payload.image) > 50:
            try:
                pil_img = base64_to_image(payload.image)
                damage_result = run_damage_pipeline(pil_img)
                product_category = damage_result.get("product_category")
                damage_type = damage_result.get("damage_type")
            except Exception as img_err:
                print("Image processing warning:", img_err)

        analysis = detect_service_from_multimodal(
            product_category=product_category,
            damage_type=damage_type,
            text=f"{payload.title or ''} {payload.description or ''}".strip()
        )

        analysis["damage_analysis"] = damage_result
        return analysis
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Job analysis failed: {str(e)}")

class VoiceJobRequest(BaseModel):
    transcript: str
    language: Optional[str] = "auto"

@app.post("/api/voice-job-analysis")
async def api_voice_job_analysis(payload: VoiceJobRequest):
    try:
        from multilingual_voice import analyze_voice_transcript
        result = analyze_voice_transcript(
            transcript=payload.transcript,
            selected_lang=payload.language
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# ===========================================================================
# 1. RAPIDO-STYLE WORKER NAVIGATION & LIVE LOCATION ENDPOINTS
# ===========================================================================
from database import (
    set_or_init_job_location,
    update_worker_live_location,
    update_job_journey_status,
    get_job_location,
    stop_tracking_session,
    set_bidding_preference,
    get_bidding_preference,
    submit_verification_request,
    get_user_verification,
    get_admin_verification_list,
    admin_review_verification_record,
    check_duplicate_document,
)
from verification_service import validate_identity_document
from ai_assistant import answer_ai_query

class InitLocationRequest(BaseModel):
    customer_id: str
    customer_lat: float
    customer_lng: float
    customer_address: str
    worker_id: Optional[str] = None

class UpdateWorkerLocationRequest(BaseModel):
    worker_id: str
    worker_lat: float
    worker_lng: float
    is_sharing: Optional[bool] = True

class UpdateJourneyStatusRequest(BaseModel):
    worker_id: str
    status: str

@app.post("/api/jobs/{job_id}/location/init")
async def api_init_job_location(job_id: str, payload: InitLocationRequest):
    try:
        rec = set_or_init_job_location(
            job_id=job_id,
            customer_id=payload.customer_id,
            customer_lat=payload.customer_lat,
            customer_lng=payload.customer_lng,
            customer_address=payload.customer_address,
            worker_id=payload.worker_id,
        )
        return {"status": "success", "data": rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs/{job_id}/location/update")
async def api_update_worker_location(job_id: str, payload: UpdateWorkerLocationRequest):
    try:
        rec = update_worker_live_location(
            job_id=job_id,
            worker_id=payload.worker_id,
            worker_lat=payload.worker_lat,
            worker_lng=payload.worker_lng,
            is_sharing=payload.is_sharing if payload.is_sharing is not None else True,
        )
        return {"status": "success", "data": rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}/location")
async def api_get_job_location(job_id: str, caller_id: Optional[str] = None):
    rec = get_job_location(job_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Location tracking session not found for this job")
    # Caller authorization: if caller_id is passed, must match customer or worker
    if caller_id and caller_id not in {rec["customer_id"], rec["worker_id"]}:
        raise HTTPException(status_code=403, detail="Unauthorized: Exact address and live tracking are restricted to the job customer and assigned worker.")
    return {"status": "success", "data": rec}

@app.post("/api/jobs/{job_id}/location/status")
async def api_update_journey_status(job_id: str, payload: UpdateJourneyStatusRequest):
    try:
        rec = update_job_journey_status(
            job_id=job_id,
            worker_id=payload.worker_id,
            new_status=payload.status,
        )
        return {"status": "success", "data": rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs/{job_id}/location/stop-tracking")
async def api_stop_tracking(job_id: str, worker_id: Optional[str] = None):
    success = stop_tracking_session(job_id, worker_id)
    return {"status": "success", "tracking_stopped": success}

# ===========================================================================
# 2. CUSTOMER-CONTROLLED BIDDING ON/OFF ENDPOINTS
# ===========================================================================
class BiddingSettingsRequest(BaseModel):
    customer_id: str
    allow_bidding: bool

@app.post("/api/jobs/{job_id}/bidding-settings")
async def api_set_bidding_settings(job_id: str, payload: BiddingSettingsRequest):
    try:
        rec = set_bidding_preference(
            job_id=job_id,
            customer_id=payload.customer_id,
            allow_bidding=payload.allow_bidding,
        )
        return {"status": "success", "data": rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}/bidding-settings")
async def api_get_bidding_settings(job_id: str):
    rec = get_bidding_preference(job_id)
    return {"status": "success", "data": rec}

@app.post("/api/jobs/{job_id}/can-bid")
async def api_check_can_bid(job_id: str):
    settings = get_bidding_preference(job_id)
    allow = settings.get("allow_bidding", True)
    if not allow:
        raise HTTPException(
            status_code=403,
            detail="Bidding is disabled for this job by the customer. Workers are selected via direct AI recommendations."
        )
    return {
        "status": "allowed",
        "can_bid": True,
        "message": "Bidding is open for this job."
    }

# ===========================================================================
# 3. FLOATING AI ASSISTANT ENDPOINT (MULTILINGUAL TE/TA/HI/EN)
# ===========================================================================
class AIAssistantRequest(BaseModel):
    query: str
    language: Optional[str] = "auto"

@app.post("/api/ai-assistant")
async def api_ai_assistant(payload: AIAssistantRequest):
    try:
        res = answer_ai_query(query=payload.query, selected_lang=payload.language)
        return {"status": "success", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Assistant query failed: {str(e)}")

# ===========================================================================
# 4. REAL WORKER & CUSTOMER VERIFICATION ENDPOINTS
# ===========================================================================
class SubmitVerificationRequest(BaseModel):
    user_id: str
    user_name: str
    role: Optional[str] = "worker"
    document_type: str
    document_number: str
    admin_notes: Optional[str] = None

class AdminReviewVerificationRequest(BaseModel):
    actor_id: str
    action: str  # approve, reject, request_review
    notes: Optional[str] = None

@app.post("/api/verification/submit")
async def api_submit_verification(payload: SubmitVerificationRequest):
    try:
        # 1. Run real algorithm / format validation
        val = validate_identity_document(
            doc_type=payload.document_type,
            raw_number=payload.document_number,
            full_name=payload.user_name,
        )

        # 2. Check for suspicious duplicate account usage
        doc_hash = val["doc_hash"]
        is_dup = check_duplicate_document(doc_hash, exclude_user_id=payload.user_id)
        if is_dup:
            val["status"] = "failed"
            val["risk_level"] = "high"
            val["reason"] = "Fraud Alert: This document credential is already registered with another NearWork account."

        # 3. Store record with audit trail
        rec = submit_verification_request(
            user_id=payload.user_id,
            user_name=payload.user_name,
            role=payload.role or "worker",
            document_type=payload.document_type,
            document_number_masked=val["masked_number"],
            document_hash=doc_hash,
            status=val["status"],
            risk_level=val["risk_level"],
            failure_reason=val.get("reason"),
            provider_status=val["provider_status"],
            admin_notes=payload.admin_notes or val.get("provider_note"),
        )

        return {
            "status": "success",
            "verification": rec,
            "validation_details": val
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Verification submission failed: {str(e)}")

@app.get("/api/verification/status/{user_id}")
async def api_get_verification_status(user_id: str):
    res = get_user_verification(user_id)
    return {"status": "success", "data": res}

@app.get("/api/verification/admin/list")
async def api_get_admin_verifications(status_filter: Optional[str] = None):
    res = get_admin_verification_list(status_filter=status_filter)
    return {"status": "success", "data": res}

@app.post("/api/verification/admin/review/{rec_id}")
async def api_admin_review_verification(rec_id: str, payload: AdminReviewVerificationRequest):
    try:
        rec = admin_review_verification_record(
            rec_id=rec_id,
            actor_id=payload.actor_id,
            action=payload.action,
            admin_notes=payload.notes,
        )
        return {"status": "success", "data": rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
# 5. MARKETPLACE JOBS FALLBACK & DEMO PERSISTENCE ENDPOINTS
# ===========================================================================
from database import save_marketplace_job, get_marketplace_job, list_marketplace_jobs

class CreateMarketplaceJobRequest(BaseModel):
    id: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = "Customer"
    title: str
    description: str
    category: str
    service: Optional[str] = None
    budget_min: Optional[int] = 0
    budget_max: Optional[int] = 0
    is_negotiable: Optional[bool] = True
    is_instant: Optional[bool] = False
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    location_name: Optional[str] = "Customer location"
    status: Optional[str] = "open"

@app.post("/api/jobs/create")
async def api_create_marketplace_job(payload: CreateMarketplaceJobRequest):
    try:
        rec = save_marketplace_job(payload.dict())
        return {"status": "success", "data": rec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}/details")
async def api_get_marketplace_job_details(job_id: str):
    rec = get_marketplace_job(job_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Job not found in marketplace store")
    return {"status": "success", "data": rec}

@app.get("/api/jobs/list")
async def api_list_marketplace_jobs(customer_id: Optional[str] = None, status: Optional[str] = None):
    jobs = list_marketplace_jobs(customer_id=customer_id, status=status)
    return {"status": "success", "data": jobs}
