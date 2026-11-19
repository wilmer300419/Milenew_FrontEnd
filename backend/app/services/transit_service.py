import hashlib
import math
import time
from datetime import datetime, timezone

from flask import current_app

from ..repositories import transit_repository
from ..utils.errors import NotFoundError, ValidationError
from ..utils.validation import MAX_INT, get_str

DEFAULT_ROUTE = "caracas-b75"
DWELL_FRACTION = 0.25   # primer 25 % de cada tramo: el bus está detenido en la estación
UPCOMING_STOPS = 5


# ---------------------------------------------------------------- estaciones
def _get_route(route_code):
    route = transit_repository.get_route(route_code)
    if not route:
        raise NotFoundError("Ruta no encontrada")
    return route


def list_routes():
    return transit_repository.list_routes()


def list_stations(route_code=DEFAULT_ROUTE):
    _get_route(route_code)
    return transit_repository.list_stations(route_code)


# ---------------------------------------------------------------- simulación
def _hash_int(*parts):
    digest = hashlib.sha256("|".join(map(str, parts)).encode()).digest()
    return int.from_bytes(digest[:4], "big")


def stop_sequence(stations, service):
    """Índices de las estaciones donde para un servicio (expreso: solo las marcadas)."""
    all_stops = list(range(len(stations)))
    if service != "Expreso":
        return all_stops
    express = [i for i, s in enumerate(stations) if s["is_express_stop"]]
    return express if len(express) >= 2 else all_stops


def _station_at_boundary(seq, boundary):
    """Estación (índice) en la que está el bus al llegar al límite de tramo `boundary`."""
    cycle = 2 * (len(seq) - 1)
    b = boundary % cycle
    return seq[b] if b <= len(seq) - 1 else seq[cycle - b]


def simulate_vehicle(vehicle_code, seq, cars_count, seconds_per_stop, now=None):
    """Posición y ocupación SIMULADAS (todavía no hay GPS ni sensores reales).

    El bus recorre `seq` (índices de estación) norte -> sur y vuelve. Es determinista:
    el mismo instante da el mismo resultado en todos los clientes.
    """
    now = time.time() if now is None else now
    m = len(seq)
    if m < 2:
        idx = seq[0] if seq else None
        return {"currentIndex": idx, "nextIndex": idx, "position": idx, "direction": "sur",
                "atStation": True, "speed": 0, "occupancyPct": 0, "cars": [], "upcoming": []}

    cycle = 2 * (m - 1)
    progress = now / seconds_per_stop + _hash_int(vehicle_code) % cycle + (_hash_int(vehicle_code, "f") % 1000) / 1000
    seg_abs = int(progress)
    fraction = progress - seg_abs
    seg = seg_abs % cycle

    current = _station_at_boundary(seq, seg_abs)
    nxt = _station_at_boundary(seq, seg_abs + 1)
    direction = "sur" if nxt > current else "norte"

    at_station = fraction < DWELL_FRACTION
    travel = 0.0 if at_station else (fraction - DWELL_FRACTION) / (1 - DWELL_FRACTION)
    eased = travel * travel * (3 - 2 * travel)  # acelera y frena suave
    position = current + (nxt - current) * eased

    if at_station:
        speed = 0
    else:
        top = 34 + _hash_int(vehicle_code, seg_abs, "speed") % 19          # 34..52 km/h
        speed = max(8, round(top * math.sin(math.pi * travel)))

    cars = [{"n": n, "pct": 15 + _hash_int(vehicle_code, seg_abs, n) % 81} for n in range(1, cars_count + 1)]
    occupancy = round(sum(c["pct"] for c in cars) / len(cars)) if cars else 0

    upcoming = [
        {"index": _station_at_boundary(seq, seg_abs + k), "etaSeconds": round((k - fraction) * seconds_per_stop)}
        for k in range(1, UPCOMING_STOPS + 1)
    ]
    return {"currentIndex": current, "nextIndex": nxt, "position": round(position, 3), "direction": direction,
            "atStation": at_station, "speed": speed, "occupancyPct": occupancy, "cars": cars,
            "upcoming": upcoming, "_progress": progress, "_seq": seq, "_seg": seg}


def eta_to_station(sim, target_index, seconds_per_stop):
    """Segundos hasta que el bus llegue a `target_index` (None si no para ahí)."""
    seq = sim["_seq"]
    if target_index not in seq:
        return None
    if sim["atStation"] and sim["currentIndex"] == target_index:
        return 0
    seg_abs = int(sim["_progress"])
    fraction = sim["_progress"] - seg_abs
    for k in range(1, 2 * (len(seq) - 1) + 1):
        if _station_at_boundary(seq, seg_abs + k) == target_index:
            return round((k - fraction) * seconds_per_stop)
    return None


def _sps():
    return current_app.config["SIMULATION_SECONDS_PER_STOP"]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _public_vehicle(vehicle, stations, sim):
    return {
        "vehicleId": vehicle["code"],
        "label": vehicle["label"],
        "service": vehicle["service"],
        "currentIndex": sim["currentIndex"],
        "nextIndex": sim["nextIndex"],
        "position": sim["position"],
        "direction": sim["direction"],
        "atStation": sim["atStation"],
        "speed": sim["speed"],
        "occupancyPct": sim["occupancyPct"],
        "cars": sim["cars"],
        "currentStation": stations[sim["currentIndex"]]["name"],
        "nextStation": stations[sim["nextIndex"]]["name"],
        "upcomingStops": [
            {"stationId": stations[u["index"]]["id"], "index": u["index"],
             "name": stations[u["index"]]["name"], "etaSeconds": u["etaSeconds"]}
            for u in sim["upcoming"]
        ],
    }


def _simulate_for(vehicle, stations, now=None):
    seq = stop_sequence(stations, vehicle["service"])
    return simulate_vehicle(vehicle["code"], seq, vehicle["cars_count"], _sps(), now)


# ---------------------------------------------------------------- endpoints
def route_vehicles(route_code):
    route = _get_route(route_code)
    stations = transit_repository.list_stations(route_code)
    now = time.time()
    vehicles = [_public_vehicle(v, stations, _simulate_for(v, stations, now))
                for v in transit_repository.list_vehicles(route_code)]
    return {"routeId": route["code"], "routeName": route["name"], "secondsPerStop": _sps(),
            "serverTime": _now_iso(), "vehicles": vehicles}


def _vehicle_payload(vehicle):
    route = _get_route(vehicle["route_code"])
    stations = transit_repository.list_stations(route["code"])
    pub = _public_vehicle(vehicle, stations, _simulate_for(vehicle, stations))
    return {**pub, "routeId": route["code"], "routeName": route["name"], "updatedAt": _now_iso()}


def driver_vehicle(driver_id):
    vehicle = transit_repository.get_vehicle_by_driver(driver_id)
    if not vehicle:
        raise NotFoundError("No tienes un bus asignado. Pide a la central que te asigne uno.")
    return vehicle


def my_vehicle(driver_id):
    vehicle = driver_vehicle(driver_id)
    payload = _vehicle_payload(vehicle)
    stations = transit_repository.list_stations(vehicle["route_code"])
    payload["headway"] = headway(vehicle, stations, transit_repository.list_vehicles(vehicle["route_code"]))
    return payload


def vehicle_location(vehicle):
    """Texto con la ubicación simulada del bus (para los reportes del operador)."""
    stations = transit_repository.list_stations(vehicle["route_code"])
    sim = _simulate_for(vehicle, stations)
    current, nxt = stations[sim["currentIndex"]]["name"], stations[sim["nextIndex"]]["name"]
    return f"En {current}" if sim["atStation"] else f"Entre {current} y {nxt}"


# ---------------------------------------------------------------- regulación (intervalos)
HEADWAY_TOLERANCE = 0.25   # ±25 % del intervalo ideal se considera "a tiempo"


def _loop_position(sim, n):
    """Posición sobre el recorrido de ida y vuelta (0 .. 2(n-1)), en unidades de estación."""
    return sim["position"] if sim["direction"] == "sur" else 2 * (n - 1) - sim["position"]


def headway(vehicle, stations, vehicles, now=None):
    """Intervalo con el bus de adelante y el de atrás (del mismo servicio), y si va adelantado o atrasado.

    En un BRT se regula por intervalo: lo ideal es ir a la misma distancia (en tiempo) del bus
    de adelante y del de atrás. None si no hay otros buses en la troncal.
    """
    n = len(stations)
    others = [v for v in vehicles if v["code"] != vehicle["code"]]
    # Se regula contra los buses del mismo servicio (B75 con B75); si no hay, contra todos
    others = [v for v in others if v["service"] == vehicle["service"]] or others
    if n < 2 or not others:
        return None
    now = time.time() if now is None else now
    loop = 2 * (n - 1)
    me = _simulate_for(vehicle, stations, now)
    origin = _loop_position(me, n)
    # El bus recorre toda la vuelta (loop unidades) en 2(m-1) tramos de `sps` segundos
    seconds_per_unit = 2 * (len(me["_seq"]) - 1) * _sps() / loop

    ahead = behind = None
    for v in others:
        d = (_loop_position(_simulate_for(v, stations, now), n) - origin) % loop
        if ahead is None or d < ahead[0]:
            ahead = (d, v)
        if behind is None or loop - d < behind[0]:
            behind = (loop - d, v)

    ahead_s, behind_s = round(ahead[0] * seconds_per_unit), round(behind[0] * seconds_per_unit)
    target = (ahead_s + behind_s) / 2
    deviation = (behind_s - ahead_s) / 2      # > 0: va muy pegado al de adelante (adelantado)
    status = "on_time"
    if deviation > HEADWAY_TOLERANCE * target:
        status = "early"
    elif deviation < -HEADWAY_TOLERANCE * target:
        status = "late"

    def info(entry, seconds):
        return {"label": entry[1]["label"], "service": entry[1]["service"], "seconds": seconds}

    return {"ahead": info(ahead, ahead_s), "behind": info(behind, behind_s), "status": status,
            "deviation_seconds": round(deviation), "target_seconds": round(target)}


def punctuality_pct(vehicle, stations, vehicles, start, end, samples=60):
    """% del tiempo entre start y end en que el bus estuvo "a tiempo" (muestreado)."""
    if end - start < 1 or len(vehicles) < 2:
        return None
    step = (end - start) / samples
    hits = [headway(vehicle, stations, vehicles, start + step * (k + 0.5)) for k in range(samples)]
    return round(100 * sum(h["status"] == "on_time" for h in hits) / samples)


# ---------------------------------------------------------------- estadísticas de turno
def _km(a, b):
    """Distancia en km entre dos estaciones (haversine); 0.8 km si no hay coordenadas."""
    if None in (a["lat"], a["lng"], b["lat"], b["lng"]):
        return 0.8
    lat1, lng1, lat2, lng2 = map(math.radians, map(float, (a["lat"], a["lng"], b["lat"], b["lng"])))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def shift_stats(vehicle, route, stations, vehicles, shift_key, driving_seconds, start, end):
    """Resumen ESTIMADO de un turno a escala real (el mapa usa una simulación acelerada).

    Paradas = tiempo conducido / minutos por parada de la troncal; km y pasajeros salen de esas
    paradas; la puntualidad, del intervalo con los otros buses durante el turno.
    """
    seq = stop_sequence(stations, vehicle["service"])
    route_km = sum(_km(stations[i], stations[i + 1]) for i in range(len(stations) - 1))
    stops = int(driving_seconds // (float(route["minutes_per_stop"]) * 60)) if len(seq) > 1 else 0
    km_per_stop = route_km / max(1, len(seq) - 1)
    return {
        "stops": stops,
        "km": round(stops * km_per_stop, 1),
        "laps": round(stops / max(1, 2 * (len(seq) - 1)), 1),
        "passengers": sum(4 + _hash_int(vehicle["code"], shift_key, k) % 27 for k in range(stops)),
        "punctuality_pct": punctuality_pct(vehicle, stations, vehicles, start, end),
    }


def station_arrivals(station_id, route_code=DEFAULT_ROUTE):
    stations = transit_repository.list_stations(route_code)
    index = next((i for i, s in enumerate(stations) if s["id"] == station_id), None)
    if index is None:
        raise NotFoundError("Estación no encontrada")

    now = time.time()
    arrivals = []
    for v in transit_repository.list_vehicles(route_code):
        sim = _simulate_for(v, stations, now)
        eta = eta_to_station(sim, index, _sps())
        if eta is None:
            continue
        arrivals.append({"vehicleId": v["code"], "label": v["label"], "service": v["service"],
                         "direction": sim["direction"], "etaSeconds": eta,
                         "currentStation": stations[sim["currentIndex"]]["name"]})
    arrivals.sort(key=lambda a: a["etaSeconds"])
    return {"station": stations[index], "arrivals": arrivals, "serverTime": _now_iso()}


# ---------------------------------------------------------------- planificador
def _parse_id(raw, field, errors):
    try:
        value = int(raw)
        if 1 <= value <= MAX_INT:
            return value
    except (TypeError, ValueError):
        pass
    errors[field] = "Selecciona una estación válida"
    return None


def parse_station_pair(source, from_key="from", to_key="to"):
    errors = {}
    from_id = _parse_id(source.get(from_key), from_key, errors)
    to_id = _parse_id(source.get(to_key), to_key, errors)
    if errors:
        raise ValidationError(errors)
    return from_id, to_id


def trip_plan(args, route_code=DEFAULT_ROUTE):
    """Misma lógica que el planificador original del FrontEnd, con los datos de la BD."""
    from_id, to_id = parse_station_pair(args)
    return compute_plan(from_id, to_id, route_code)


def compute_plan(from_id, to_id, route_code=DEFAULT_ROUTE):
    route = _get_route(route_code)
    stations = transit_repository.list_stations(route_code)
    index = {s["id"]: i for i, s in enumerate(stations)}
    if from_id not in index or to_id not in index:
        raise NotFoundError("Estación no encontrada")

    fi, ti = index[from_id], index[to_id]
    if fi == ti:
        return {"sameStation": True}

    minutes_per_stop = float(route["minutes_per_stop"])
    lo, hi = min(fi, ti), max(fi, ti)
    stops = hi - lo
    corridor_minutes = round(stops * minutes_per_stop + 3)

    express_stops = [i for i in range(lo, hi + 1) if stations[i]["is_express_stop"]]
    express_available = (stations[fi]["is_express_stop"] and stations[ti]["is_express_stop"]
                         and len(express_stops) >= 2)
    express_minutes = (round((len(express_stops) - 1) * minutes_per_stop + stops * 0.35 + 3)
                       if express_available else None)

    use_express = express_available and express_minutes < corridor_minutes
    legs = [
        {"station": stations[i],
         "skipped": use_express and not stations[i]["is_express_stop"] and i not in (lo, hi)}
        for i in range(lo, hi + 1)
    ]
    if ti < fi:
        legs.reverse()
    return {
        "sameStation": False,
        "stops": stops,
        "direction": "sur" if ti > fi else "norte",
        "fare": route["fare"],
        "bestService": "Expreso" if use_express else "Corriente",
        "bestMinutes": express_minutes if use_express else corridor_minutes,
        "savedMinutes": corridor_minutes - express_minutes if express_available else 0,
        "expressAvailable": express_available,
        "legs": legs,
    }


# ---------------------------------------------------------------- incidencias
def create_incident(data, user_id):
    category = get_str(data, "category").strip()
    description = get_str(data, "description").strip()
    route_code = get_str(data, "routeId").strip() or DEFAULT_ROUTE

    allowed = transit_repository.list_incident_categories()
    errors = {}
    if category not in allowed:
        errors["category"] = "Categoría inválida. Opciones: " + ", ".join(allowed)
    if len(description) > 500:
        errors["description"] = "La descripción no puede superar 500 caracteres"
    if errors:
        raise ValidationError(errors)

    return transit_repository.create_incident(category, description or None, user_id, route_code)


def incident_categories():
    return transit_repository.list_incident_categories()
