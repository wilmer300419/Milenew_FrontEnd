from datetime import timedelta

from psycopg import errors as pg_errors

from ..repositories import transit_repository, trip_repository
from ..utils.errors import ApiError, NotFoundError
from ..utils.validation import MAX_INT, is_int
from . import transit_service


def _station_ids(route_code=transit_service.DEFAULT_ROUTE):
    return {s["id"] for s in transit_repository.list_stations(route_code)}


# ---------------------------------------------------------------- favoritas
def list_favorites(user_id):
    return trip_repository.list_favorites(user_id)


def _check_station(station_id):
    if not is_int(station_id) or not 1 <= station_id <= MAX_INT or station_id not in _station_ids():
        raise NotFoundError("Estación no encontrada")


def add_favorite(user_id, station_id):
    _check_station(station_id)
    trip_repository.add_favorite(user_id, station_id)
    return trip_repository.list_favorites(user_id)


def remove_favorite(user_id, station_id):
    _check_station(station_id)
    trip_repository.remove_favorite(user_id, station_id)
    return trip_repository.list_favorites(user_id)


# ---------------------------------------------------------------- viajes
def create_trip(user_id, data):
    from_id, to_id = transit_service.parse_station_pair(data, "fromStationId", "toStationId")
    plan = transit_service.compute_plan(from_id, to_id)
    if plan["sameStation"]:
        raise ApiError("Origen y destino deben ser estaciones distintas", 400)

    try:
        trip = trip_repository.create_trip(user_id, transit_service.DEFAULT_ROUTE, from_id, to_id,
                                           plan["bestService"], plan["fare"], plan["bestMinutes"])
    except pg_errors.CheckViolation as exc:
        raise ApiError("Saldo insuficiente. Recarga tu tarjeta TuLlave para pagar el pasaje.", 400,
                       {"balance": "insuficiente"}) from exc
    return {**_with_eta(trip), "minutes": plan["bestMinutes"]}


def list_trips(user_id):
    return trip_repository.list_trips(user_id)


def _with_eta(trip):
    return {**trip, "arrives_at": trip["started_at"] + timedelta(minutes=trip["estimated_minutes"])}


def active_trip(user_id):
    trip = trip_repository.get_active(user_id)
    return _with_eta(trip) if trip else None


def finish_trip(user_id, trip_id):
    if not 1 <= trip_id <= MAX_INT or not trip_repository.finish(user_id, trip_id):
        raise NotFoundError("No tienes un viaje en curso con ese número")
