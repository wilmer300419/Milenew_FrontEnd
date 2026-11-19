"""Panel del operador: turno, novedades/SOS, avisos con confirmación e intervalo."""
from .conftest import auth


def _complete_checklist(client, h):
    for item in client.get("/api/transit/checklist", headers=h).get_json()["data"]:
        client.post("/api/transit/checklist", json={"itemId": item["id"], "done": True}, headers=h)


def test_shift_lifecycle(client, driver, admin):
    hd, ha = auth(driver["token"]), auth(admin["token"])
    state = client.get("/api/transit/shift", headers=hd).get_json()["data"]
    assert state["active"] is None and state["requirements"]["hasVehicle"]

    res = client.post("/api/transit/shift/start", headers=hd)
    assert res.status_code == 400 and "checklist" in res.get_json()["errors"]

    _complete_checklist(client, hd)
    res = client.post("/api/transit/shift/start", headers=hd)
    assert res.status_code == 201 and res.get_json()["data"]["vehicleCode"] == "vagon-02"
    assert client.post("/api/transit/shift/start", headers=hd).status_code == 409
    fleet = client.get("/api/admin/fleet", headers=ha).get_json()["data"]["vehicles"]
    assert next(v for v in fleet if v["code"] == "vagon-02")["shiftStatus"] == "on"
    assert client.get("/api/admin/summary", headers=ha).get_json()["data"]["activeShifts"] == 1

    on_break = client.post("/api/transit/shift/break", json={"active": True}, headers=hd).get_json()["data"]
    assert on_break["onBreak"] and on_break["continuousSeconds"] == 0
    fleet = client.get("/api/admin/fleet", headers=ha).get_json()["data"]["vehicles"]
    assert next(v for v in fleet if v["code"] == "vagon-02")["shiftStatus"] == "break"
    back = client.post("/api/transit/shift/break", json={"active": False}, headers=hd).get_json()["data"]
    assert not back["onBreak"] and set(back["stats"]) == {"stops", "km", "laps", "passengers", "punctualityPct"}
    assert client.post("/api/transit/shift/break", json={"active": "x"}, headers=hd).status_code == 400

    ended = client.post("/api/transit/shift/end", headers=hd).get_json()["data"]
    assert ended["endedAt"] and ended["stats"]["stops"] == 0
    state = client.get("/api/transit/shift", headers=hd).get_json()["data"]
    assert state["active"] is None and state["last"]["id"] == ended["id"]
    assert client.post("/api/transit/shift/end", headers=hd).status_code == 404
    assert client.post("/api/transit/shift/break", json={"active": True}, headers=hd).status_code == 404


def test_sos_and_reports_reach_central(client, driver, admin, passenger):
    hd, ha = auth(driver["token"]), auth(admin["token"])
    data = client.get("/api/transit/driver-reports", headers=hd).get_json()["data"]
    assert "Accidente de tránsito" in data["categories"] and "Emergencia (SOS)" not in data["categories"]
    passenger_cats = client.get("/api/transit/incident-categories").get_json()["data"]
    assert "Aglomeración" in passenger_cats and "Emergencia (SOS)" not in passenger_cats
    assert client.post("/api/transit/incidents", json={"category": "Emergencia (SOS)"}).status_code == 400

    res = client.post("/api/transit/driver-reports", json={"sos": True}, headers=hd)
    sos = res.get_json()["data"]
    assert res.status_code == 201 and sos["priority"] == "sos" and sos["location"].startswith(("En ", "Entre "))
    again = client.post("/api/transit/driver-reports", json={"sos": True}, headers=hd)
    assert again.status_code == 200 and again.get_json()["data"]["id"] == sos["id"]

    assert client.post("/api/transit/driver-reports", json={"category": "Aglomeración"}, headers=hd).status_code == 400
    assert client.post("/api/transit/driver-reports", json={"category": "Accidente de tránsito",
                                                            "description": "Choque leve"}, headers=hd).status_code == 201
    assert client.post("/api/transit/driver-reports", json={"sos": True},
                       headers=auth(passenger["token"])).status_code == 403

    assert client.get("/api/admin/summary", headers=ha).get_json()["data"]["sosOpen"] == 1
    first = client.get("/api/admin/incidents", headers=ha).get_json()["data"][0]
    assert first["priority"] == "sos" and first["fromDriver"] and first["vehicleLabel"] == "B75 · 7042"

    client.patch(f"/api/admin/incidents/{sos['id']}", json={"status": "closed", "note": "Apoyo en camino"}, headers=ha)
    assert client.get("/api/admin/summary", headers=ha).get_json()["data"]["sosOpen"] == 0
    mine = client.get("/api/transit/driver-reports", headers=hd).get_json()["data"]["reports"]
    assert [r["status"] for r in mine] == ["open", "closed"] and mine[1]["resolutionNote"] == "Apoyo en camino"


def test_driver_notices_with_ack(client, driver, admin, passenger):
    hd, ha = auth(driver["token"]), auth(admin["token"])
    res = client.post("/api/admin/notices", json={"title": "Desvío Calle 26", "audience": "drivers"}, headers=ha)
    notice = res.get_json()["data"]
    assert res.status_code == 201 and notice["audience"] == "drivers"
    assert client.post("/api/admin/notices", json={"title": "Hola", "audience": "x"}, headers=ha).status_code == 400

    titles = [n["title"] for n in client.get("/api/notifications", headers=auth(passenger["token"])).get_json()["data"]]
    assert "Desvío Calle 26" not in titles

    mine = client.get("/api/transit/driver-notices", headers=hd).get_json()["data"]
    assert next(n for n in mine if n["id"] == notice["id"])["acked"] is False
    assert client.post(f"/api/transit/driver-notices/{notice['id']}/ack", headers=hd).status_code == 200
    assert client.post(f"/api/transit/driver-notices/{notice['id']}/ack", headers=hd).status_code == 200  # idempotente
    mine = client.get("/api/transit/driver-notices", headers=hd).get_json()["data"]
    assert next(n for n in mine if n["id"] == notice["id"])["acked"] is True
    listed = client.get("/api/admin/notices", headers=ha).get_json()["data"]
    assert next(n for n in listed if n["id"] == notice["id"])["acks"] == 1
    assert client.post("/api/transit/driver-notices/99999/ack", headers=hd).status_code == 404


def test_my_vehicle_includes_headway(client, driver):
    bus = client.get("/api/transit/my-vehicle", headers=auth(driver["token"])).get_json()["data"]
    h = bus["headway"]
    assert h["status"] in ("early", "on_time", "late") and h["ahead"]["label"] and h["behind"]["seconds"] >= 0
