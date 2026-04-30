from fastapi import APIRouter, HTTPException, status

from app.schemas import support_schema as schemas
from app.services.email_service import send_problem_report_email

router = APIRouter(prefix="/support", tags=["Support"])


@router.post("/problem-report", response_model=schemas.MessageResponse)
def submit_problem_report(payload: schemas.ProblemReportCreate):
    try:
        send_problem_report_email(
            context=payload.context,
            category=payload.category,
            reporter_email=str(payload.email),
            reporter_name=(payload.name or "").strip(),
            description=payload.description,
            screen_label=payload.screen_label,
            page_url=payload.page_url,
            user_agent=payload.user_agent,
        )
    except Exception as exc:  # pragma: no cover - fallback defensivo
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível enviar o relatório por e-mail.",
        ) from exc
    return schemas.MessageResponse(message="Relatório enviado com sucesso.")
