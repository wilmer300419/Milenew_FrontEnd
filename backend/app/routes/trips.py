from flask import Blueprint, g

from ..services import trip_service
from ..utils.auth import login_required
from ..utils.responses import success
from ..utils.validation import get_json_body

trips_bp = Blueprint("trips", __name__)


@trips_bp.get("")
@login_required
def list_trips():
    return success(trip_service.list_trips(g.user_id), "Tus viajes")


@trips_bp.post("")
@login_required
def create_trip():
    return success(trip_service.create_trip(g.user_id, get_json_body()), "Pasaje pagado. ¡Buen viaje!", 201)


@trips_bp.get("/active")
@login_required
def active_trip():
    trip = trip_service.active_trip(g.user_id)
    return success(trip, "Viaje en curso" if trip else "No tienes un viaje en curso")


@trips_bp.post("/<int:trip_id>/finish")
@login_required
def finish_trip(trip_id):
    trip_service.finish_trip(g.user_id, trip_id)
    return success(None, "Viaje terminado. ¡Gracias por viajar con Milenew!")
