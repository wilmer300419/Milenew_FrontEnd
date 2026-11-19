"""Tests sin base de datos: lógica pura, seguridad de rutas y formato de respuesta."""
import io
import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app import create_app, db
from app.services.notification_service import relative_time
from app.services import transit_service
from app.services.transit_service import eta_to_station, simulate_vehicle, stop_sequence
from app.utils import captcha
from app.utils.auth import create_token
from app.utils.errors import ApiError
from app.utils.responses import serialize


def test_serialize_camel_case_and_types():
    out = serialize({"is_express_stop": True, "price": Decimal("3200.00"), "x": Decimal("1.5"),
                     "nested": [{"created_at": datetime(2026, 1, 1, tzinfo=timezone.utc)}]})
    assert out == {"isExpressStop": True, "price": 3200, "x": 1.5,
                   "nested": [{"createdAt": "2026-01-01T00:00:00+00:00"}]}


ALL = list(range(19))
EXPRESS = [0, 1, 4, 6, 8, 10, 11, 13, 16, 18]


@pytest.mark.parametrize("t", [0, 7, 19.9, 20, 1234.5, 99999])
@pytest.mark.parametrize("seq", [ALL, EXPRESS])
def test_simulation_ranges(t, seq):
    sim = simulate_vehicle("vagon-02", seq, 4, 20, now=t)
    assert sim["currentIndex"] in seq and sim["nextIndex"] in seq
    assert min(sim["currentIndex"], sim["nextIndex"]) <= sim["position"] <= max(sim["currentIndex"], sim["nextIndex"])
    assert sim["direction"] == ("sur" if sim["nextIndex"] > sim["currentIndex"] else "norte")
    assert len(sim["cars"]) == 4 and all(15 <= c["pct"] <= 95 for c in sim["cars"])
    assert sim["speed"] == 0 if sim["atStation"] else 8 <= sim["speed"] <= 52
    assert [u["index"] for u in sim["upcoming"]][0] == sim["nextIndex"]
    assert all(u["index"] in seq for u in sim["upcoming"])


def test_simulation_is_deterministic_and_round_trip():
    seq = list(range(5))
    assert simulate_vehicle("v", seq, 3, 10, now=123) == simulate_vehicle("v", seq, 3, 10, now=123)
    seen = [(s["currentIndex"], s["direction"])
            for s in (simulate_vehicle("v", seq, 3, 10, now=k * 10 + 5) for k in range(8))]
    assert {i for i, _ in seen} == {0, 1, 2, 3, 4}
    assert {d for _, d in seen} == {"sur", "norte"}


def test_simulation_dwell_at_station():
    speeds = [simulate_vehicle("v", list(range(5)), 3, 10, now=t / 2)["speed"] for t in range(200)]
    assert 0 in speeds and any(s > 0 for s in speeds)


def test_eta_matches_upcoming_and_skips_non_express():
    sim = simulate_vehicle("vagon-01", EXPRESS, 4, 20, now=5000)
    for u in sim["upcoming"]:
        assert eta_to_station(sim, u["index"], 20) <= u["etaSeconds"]
    assert eta_to_station(sim, sim["upcoming"][0]["index"], 20) == sim["upcoming"][0]["etaSeconds"]
    assert eta_to_station(sim, 2, 20) is None  # Flores no es parada del expreso


def test_stop_sequence():
    stations = [{"is_express_stop": i in EXPRESS} for i in ALL]
    assert stop_sequence(stations, "Expreso") == EXPRESS
    assert stop_sequence(stations, "Corriente") == ALL


def test_relative_time():
    now = datetime(2026, 1, 10, 12, 0, tzinfo=timezone.utc)
    assert relative_time(now - timedelta(seconds=10), now) == "ahora"
    assert relative_time(now - timedelta(minutes=5), now) == "hace 5 min"
    assert relative_time(now - timedelta(hours=3), now) == "hace 3 h"
    assert relative_time(now - timedelta(days=1), now) == "ayer"
    assert relative_time(now - timedelta(days=4), now) == "hace 4 días"


class _FakeResp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def test_captcha_validated_with_google(unit_app, monkeypatch):
    calls = []

    def fake_urlopen(url, data, timeout):
        calls.append(data.decode())
        ok = "response=bueno" in data.decode()
        return _FakeResp(json.dumps({"success": ok}).encode())

    monkeypatch.setattr(captcha.urllib.request, "urlopen", fake_urlopen)
    unit_app.config["RECAPTCHA_SECRET_KEY"] = "secreto"
    with unit_app.test_request_context("/"):
        captcha.verify_captcha("bueno")
        with pytest.raises(ApiError) as exc:
            captcha.verify_captcha("malo")
        assert exc.value.status == 400
        with pytest.raises(ApiError):
            captcha.verify_captcha(None)
    assert "secret=secreto" in calls[0]


def test_login_requires_captcha_before_db(unit_app, monkeypatch):
    unit_app.config["RECAPTCHA_SECRET_KEY"] = "secreto"
    res = unit_app.test_client().post("/api/auth/login", json={"email": "a@b.co", "password": "x"})
    assert res.status_code == 400
    assert "robot" in res.get_json()["message"]


def test_login_rate_limited():
    app = create_app({"TESTING": True, "SECRET_KEY": "x" * 32, "RECAPTCHA_SECRET_KEY": "",
                      "DB_POOL_ENABLED": False, "RATELIMIT_ENABLED": True})
    client = app.test_client()
    codes = [client.post("/api/auth/login", json={}).status_code for _ in range(11)]
    assert codes[:10] == [400] * 10 and codes[10] == 429
    assert "Demasiados intentos" in client.post("/api/auth/login", json={}).get_json()["message"]


def test_build_call_safe():
    assert db._build_call("fn_station_list", ("x",)) == "SELECT * FROM fn_station_list(%s)"
    with pytest.raises(ValueError):
        db._build_call("fn(); DROP TABLE users; --", ())


def test_missing_secret_key_fails_fast():
    with pytest.raises(RuntimeError):
        create_app({"SECRET_KEY": ""})


def test_db_down_returns_503_json(unit_app):
    client = unit_app.test_client()
    res = client.get("/api/transit/stations")
    assert res.status_code == 503
    assert res.get_json() == {"success": False, "message": "Servicio de base de datos no disponible"}
    assert client.get("/api/health").status_code == 503


@pytest.mark.parametrize("method,url", [
    ("get", "/api/wallet"), ("post", "/api/wallet/recharge"), ("get", "/api/users/me"),
    ("put", "/api/users/me"), ("put", "/api/users/me/password"), ("get", "/api/transit/checklist"),
    ("get", "/api/transit/operations-chat"), ("get", "/api/transit/my-vehicle"),
    ("post", "/api/auth/logout-all"), ("delete", "/api/users/me"),
])
def test_protected_routes_need_token(unit_app, method, url):
    res = getattr(unit_app.test_client(), method)(url, json={})
    assert res.status_code == 401
    assert res.get_json()["success"] is False


@pytest.mark.parametrize("url", ["/api/transit/checklist", "/api/transit/operations-chat",
                                 "/api/transit/my-vehicle"])
def test_driver_routes_forbidden_for_passenger(unit_app, url, monkeypatch):
    from app.utils import auth as auth_utils
    monkeypatch.setattr(auth_utils, "call_function_one", lambda *a: {"fn_session_check": True})
    with unit_app.app_context():
        token = create_token({"id": 1, "role": "user"})
    res = unit_app.test_client().get(url, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_unknown_route_json(unit_app):
    res = unit_app.test_client().get("/api/no-existe")
    assert res.status_code == 404
    assert res.get_json()["success"] is False


def test_cors_preflight(unit_app):
    res = unit_app.test_client().options("/api/transit/stations", headers={
        "Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization"})
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def _line(n):
    return [{"id": i, "name": f"E{i}", "is_express_stop": i % 2 == 0, "lat": 4.6 + i / 100, "lng": -74.06}
            for i in range(n)]


def test_headway_ahead_behind_and_status(unit_app):
    stations = _line(10)
    buses = [{"code": f"bus-{k}", "label": f"B{k}", "service": "Corriente", "cars_count": 3} for k in range(4)]
    with unit_app.app_context():
        for t in (0, 777, 5000):
            h = transit_service.headway(buses[0], stations, buses, now=t)
            # Ida y vuelta = 18 tramos de 20 s: los dos intervalos suman como mucho una vuelta
            assert 0 <= h["ahead"]["seconds"] + h["behind"]["seconds"] <= 18 * 20 + 1
            assert h["status"] in ("early", "on_time", "late")
            assert h["target_seconds"] == round((h["ahead"]["seconds"] + h["behind"]["seconds"]) / 2)
        assert transit_service.headway(buses[0], stations, buses[:1]) is None


def test_shift_stats_scale_with_driving_time(unit_app):
    stations, route = _line(10), {"minutes_per_stop": 2}
    buses = [{"code": f"bus-{k}", "label": f"B{k}", "service": "Corriente", "cars_count": 3} for k in range(3)]
    with unit_app.app_context():
        hour = transit_service.shift_stats(buses[0], route, stations, buses, 1, 3600, 0, 3600)
        two = transit_service.shift_stats(buses[0], route, stations, buses, 1, 7200, 0, 7200)
    assert hour["stops"] == 30 and two["stops"] == 60
    assert 0 < hour["km"] < two["km"] and hour["laps"] == round(30 / 18, 1)
    assert 0 < hour["passengers"] < two["passengers"] and 0 <= hour["punctuality_pct"] <= 100
