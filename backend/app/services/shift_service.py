"""Turno del operador: inicio (con checklist completo), pausas, cierre y resumen."""
from datetime import datetime, timezone

from ..repositories import driver_ops_repository, operations_repository, transit_repository
from ..utils.errors import ConflictError, NotFoundError, ValidationError
from . import transit_service
from .operations_service import _today

CONTINUOUS_LIMIT_SECONDS = 4 * 3600   # se recomienda una pausa activa tras 4 h seguidas


def _now():
    return datetime.now(timezone.utc)


def _times(shift, now):
    """Segundos de pausa, de conducción y de conducción continua del turno."""
    end = shift["ended_at"] or now
    on_break = shift["break_started_at"] is not None and shift["ended_at"] is None
    current_break = (now - shift["break_started_at"]).total_seconds() if on_break else 0
    breaks = shift["break_seconds"] + current_break
    driving = max(0, (end - shift["started_at"]).total_seconds() - breaks)
    since = shift["last_break_end"] or shift["started_at"]
    continuous = 0 if on_break or shift["ended_at"] else max(0, (now - since).total_seconds())
    return on_break, round(breaks), round(driving), round(continuous)


def _stats(shift, driving, end):
    route = transit_repository.get_route(shift["route_code"])
    vehicles = transit_repository.list_vehicles(shift["route_code"]) if route else []
    vehicle = next((v for v in vehicles if v["code"] == shift["vehicle_code"]), None)
    if not vehicle:
        return None
    stations = transit_repository.list_stations(shift["route_code"])
    return transit_service.shift_stats(vehicle, route, stations, vehicles, shift["id"], driving,
                                       shift["started_at"].timestamp(), end.timestamp())


def _public(shift, now=None):
    if not shift:
        return None
    now = now or _now()
    on_break, breaks, driving, continuous = _times(shift, now)
    return {
        "id": shift["id"],
        "vehicle_code": shift["vehicle_code"],
        "route_code": shift["route_code"],
        "started_at": shift["started_at"],
        "ended_at": shift["ended_at"],
        "on_break": on_break,
        "break_started_at": shift["break_started_at"] if on_break else None,
        "break_seconds": breaks,
        "driving_seconds": driving,
        "continuous_seconds": continuous,
        "break_recommended": continuous >= CONTINUOUS_LIMIT_SECONDS,
        "stats": shift["summary"] if shift["ended_at"] else _stats(shift, driving, now),
    }


def get_shift(driver_id):
    checklist = operations_repository.list_checklist(driver_id, _today())
    return {
        "active": _public(driver_ops_repository.get_open_shift(driver_id)),
        "last": _public(driver_ops_repository.get_last_shift(driver_id)),
        "requirements": {
            "has_vehicle": transit_repository.get_vehicle_by_driver(driver_id) is not None,
            "checklist_done": sum(1 for i in checklist if i["done"]),
            "checklist_total": len(checklist),
        },
    }


def start(driver_id):
    vehicle = transit_service.driver_vehicle(driver_id)
    checklist = operations_repository.list_checklist(driver_id, _today())
    pending = [i["label"] for i in checklist if not i["done"]]
    if pending:
        raise ValidationError({"checklist": "Pendiente: " + ", ".join(pending)},
                              "Completa el checklist pre-operacional antes de iniciar el turno")
    shift = driver_ops_repository.start_shift(driver_id, vehicle["code"], vehicle["route_code"])
    if not shift:
        raise ConflictError("Ya tienes un turno en curso")
    return _public(shift)


def set_break(driver_id, data):
    active = data.get("active")
    if not isinstance(active, bool):
        raise ValidationError({"active": "Debe ser true o false"})
    shift = driver_ops_repository.set_break(driver_id, active)
    if not shift:
        raise NotFoundError("No tienes un turno en curso")
    return _public(shift)


def end(driver_id):
    shift = driver_ops_repository.get_open_shift(driver_id)
    if not shift:
        raise NotFoundError("No tienes un turno en curso")
    now = _now()
    _, _, driving, _ = _times(shift, now)
    closed = driver_ops_repository.end_shift(driver_id, _stats(shift, driving, now))
    if not closed:
        raise NotFoundError("No tienes un turno en curso")
    return _public(closed)
