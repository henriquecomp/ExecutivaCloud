"""Expansão de regras de recorrência (datetimes/dates naive, wall-clock)."""

from __future__ import annotations

from calendar import monthrange
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import List, Optional, Protocol, Sequence


MAX_OCCURRENCES = 366


class RecurrenceLike(Protocol):
    frequency: str
    interval: int
    days_of_week: Optional[Sequence[int]]
    end_date: Optional[date]
    count: Optional[int]


@dataclass(frozen=True)
class RecurrenceParams:
    frequency: str
    interval: int
    days_of_week: Optional[List[int]] = None
    end_date: Optional[date] = None
    count: Optional[int] = None

    @classmethod
    def from_rule(cls, rule: RecurrenceLike) -> "RecurrenceParams":
        days = list(rule.days_of_week) if rule.days_of_week else None
        return cls(
            frequency=str(rule.frequency),
            interval=int(rule.interval),
            days_of_week=days,
            end_date=rule.end_date,
            count=rule.count,
        )


def _validate_rule(rule: RecurrenceParams) -> None:
    if rule.interval < 1:
        raise ValueError("O intervalo da recorrência deve ser pelo menos 1.")
    if not rule.count and not rule.end_date:
        raise ValueError("Informe a quantidade de ocorrências ou a data final da recorrência.")
    if rule.count is not None and rule.count > MAX_OCCURRENCES:
        raise ValueError(
            f"A recorrência não pode gerar mais de {MAX_OCCURRENCES} ocorrências."
        )
    if rule.frequency == "weekly" and not rule.days_of_week:
        raise ValueError("Para recorrência semanal, selecione pelo menos um dia da semana.")
    if rule.days_of_week:
        for d in rule.days_of_week:
            if d < 0 or d > 6:
                raise ValueError("Dias da semana devem estar entre 0 (domingo) e 6 (sábado).")


def _add_months(dt: datetime, months: int) -> datetime:
    year = dt.year + (dt.month - 1 + months) // 12
    month = (dt.month - 1 + months) % 12 + 1
    day = min(dt.day, monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _add_years(dt: datetime, years: int) -> datetime:
    try:
        return dt.replace(year=dt.year + years)
    except ValueError:
        return dt.replace(year=dt.year + years, day=28)


def _sunday_week_start(start: datetime) -> datetime:
    """Domingo da semana de `start`, preservando o horário."""
    # JS getDay(): Sun=0 … Sat=6. Python weekday(): Mon=0 … Sun=6.
    days_since_sunday = (start.weekday() + 1) % 7
    base = start - timedelta(days=days_since_sunday)
    return base.replace(
        hour=start.hour,
        minute=start.minute,
        second=start.second,
        microsecond=start.microsecond,
    )


def _advance(cursor: datetime, frequency: str, interval: int) -> datetime:
    if frequency == "daily":
        return cursor + timedelta(days=interval)
    if frequency == "monthly":
        return _add_months(cursor, interval)
    if frequency == "annually":
        return _add_years(cursor, interval)
    raise ValueError("Frequência de recorrência inválida.")


def expand_datetimes(start: datetime, rule: RecurrenceLike | RecurrenceParams) -> List[datetime]:
    """
    Gera horários de início das ocorrências (naive).
    Domingo = 0 … sábado = 6 (igual a Date.getDay() no JS).
    """
    params = rule if isinstance(rule, RecurrenceParams) else RecurrenceParams.from_rule(rule)
    _validate_rule(params)

    if start.tzinfo is not None:
        start = start.replace(tzinfo=None)

    final_dt: Optional[datetime] = None
    if params.end_date is not None:
        final_dt = datetime.combine(params.end_date, time(23, 59, 59, 999999))

    # Coleta até MAX+1 para detectar estouro quando só endDate limita
    hard_cap = MAX_OCCURRENCES + 1
    target = params.count if params.count is not None else hard_cap
    occurrences: List[datetime] = []

    if params.frequency == "weekly":
        days = sorted(set(params.days_of_week or []))
        week_start = _sunday_week_start(start)
        while len(occurrences) < target and (final_dt is None or week_start <= final_dt):
            for day in days:
                occ = week_start + timedelta(days=day)
                occ = occ.replace(
                    hour=start.hour,
                    minute=start.minute,
                    second=start.second,
                    microsecond=start.microsecond,
                )
                if occ < start:
                    continue
                if final_dt is not None and occ > final_dt:
                    continue
                occurrences.append(occ)
                if len(occurrences) >= target:
                    break
            if len(occurrences) >= target:
                break
            week_start = week_start + timedelta(days=7 * params.interval)
    else:
        cursor = start
        while len(occurrences) < target and (final_dt is None or cursor <= final_dt):
            occurrences.append(cursor)
            cursor = _advance(cursor, params.frequency, params.interval)

    if not occurrences:
        raise ValueError(
            "Não foi possível gerar ocorrências com a recorrência informada. "
            "Verifique os dias ou o período."
        )

    if params.count is None and len(occurrences) > MAX_OCCURRENCES:
        raise ValueError(
            f"A recorrência geraria mais de {MAX_OCCURRENCES} ocorrências. "
            "Reduza o período ou aumente o intervalo."
        )

    if params.count is not None:
        return occurrences[: params.count]
    return occurrences[:MAX_OCCURRENCES]


def expand_dates(start: date, rule: RecurrenceLike | RecurrenceParams) -> List[date]:
    """Gera datas de ocorrência a partir de uma data (tarefas)."""
    start_dt = datetime.combine(start, time.min)
    return [dt.date() for dt in expand_datetimes(start_dt, rule)]
