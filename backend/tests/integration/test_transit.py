from .conftest import auth, register


def _stations(client):
    return client.get("/api/transit/stations").get_json()["data"]


def test_stations_from_database(client):
    stations = _stations(client)
    assert len(stations) == 19
    assert stations[0]["name"] == "Calle 76" and stations[-1]["name"] == "Portal Tunal"
    assert set(stations[0]) == {"id", "code", "name", "sortOrder", "isExpressStop", "accesses"}
    assert isinstance(stations[0]["accesses"], list)


def test_route_status(client):
    res = client.get("/api/transit/routes/caracas-b75/status")
    data = res.get_json()["data"]
    assert res.status_code == 200
    assert 0 <= data["currentIndex"] <= 18
    assert len(data["telemetry"]["cars"]) == 4
    assert client.get("/api/transit/routes/no-existe/status").status_code == 404


def test_trip_plan_express_and_corridor(client):
    s = {st["name"]: st["id"] for st in _stations(client)}
    express = client.get(f"/api/transit/trip-plan?from={s['Calle 76']}&to={s['Portal Tunal']}").get_json()["data"]
    assert express["bestService"] == "Expreso" and express["direction"] == "sur"
    assert express["stops"] == 18 and express["fare"] == 3200 and express["savedMinutes"] > 0
    assert any(leg["skipped"] for leg in express["legs"])

    corridor = client.get(f"/api/transit/trip-plan?from={s['Flores']}&to={s['Calle 63']}").get_json()["data"]
    assert corridor["bestService"] == "Corriente" and corridor["direction"] == "sur"

    north = client.get(f"/api/transit/trip-plan?from={s['Calle 63']}&to={s['Flores']}").get_json()["data"]
    assert north["direction"] == "norte"

    same = client.get(f"/api/transit/trip-plan?from={s['Flores']}&to={s['Flores']}").get_json()["data"]
    assert same == {"sameStation": True}

    assert client.get("/api/transit/trip-plan?from=abc&to=1").status_code == 400
    assert client.get("/api/transit/trip-plan?from=999999&to=1").status_code == 404


def test_incidents_anonymous_and_validation(client, passenger):
    res = client.post("/api/transit/incidents", json={"category": "Seguridad"})
    assert res.status_code == 201
    assert res.get_json()["data"]["status"] == "open"
    res = client.post("/api/transit/incidents", json={"category": "Aglomeración"},
                      headers=auth(passenger["token"]))
    assert res.status_code == 201
    bad = client.post("/api/transit/incidents", json={"category": "Inventada"})
    assert bad.status_code == 400 and "category" in bad.get_json()["errors"]


def test_wallet_and_notifications(client, passenger):
    h = auth(passenger["token"])
    assert client.get("/api/wallet").status_code == 401
    assert client.get("/api/wallet", headers=h).get_json()["data"]["balance"] == 0

    res = client.post("/api/wallet/recharge", json={"amount": 10000}, headers=h)
    assert res.status_code == 200 and res.get_json()["data"]["balance"] == 10000
    client.post("/api/wallet/recharge", json={"amount": 10000}, headers=h)
    assert client.get("/api/wallet", headers=h).get_json()["data"]["balance"] == 20000

    for bad in (0, -5, 999, 10.5, "10000", 600000):
        assert client.post("/api/wallet/recharge", json={"amount": bad}, headers=h).status_code == 400

    mine = client.get("/api/notifications", headers=h).get_json()["data"]
    assert mine[0]["title"] == "Recarga exitosa" and mine[0]["unread"] is True
    assert mine[0]["relativeTime"] == "ahora"
    anon = client.get("/api/notifications").get_json()["data"]
    assert len(anon) == 3 and all(not n["unread"] for n in anon)
    assert {"id", "title", "description", "createdAt", "personal", "unread", "relativeTime"} == set(anon[0])


def test_driver_panel(client, driver, passenger):
    h = auth(driver["token"])
    assert driver["user"]["role"] == "driver"

    tel = client.get("/api/transit/vehicles/vagon-02/telemetry", headers=h).get_json()["data"]
    assert {"speed", "occupancyPct", "cars", "currentIndex"} <= set(tel)
    assert client.get("/api/transit/vehicles/nope/telemetry", headers=h).status_code == 404

    items = client.get("/api/transit/checklist", headers=h).get_json()["data"]
    assert len(items) == 5 and not any(i["done"] for i in items)
    res = client.post("/api/transit/checklist", json={"itemId": items[0]["id"], "done": True}, headers=h)
    assert res.get_json()["data"]["done"] is True
    assert client.get("/api/transit/checklist", headers=h).get_json()["data"][0]["done"] is True
    assert client.post("/api/transit/checklist", json={"itemId": 99999, "done": True}, headers=h).status_code == 404
    assert client.post("/api/transit/checklist", json={"itemId": "1", "done": "si"}, headers=h).status_code == 400

    assert client.post("/api/transit/operations-chat", json={"message": "Solicito apoyo"},
                       headers=h).status_code == 201
    chat = client.get("/api/transit/operations-chat", headers=h).get_json()["data"]
    assert [m["from"] for m in chat] == ["driver", "central"]
    assert chat[0]["text"] == "Solicito apoyo" and "Apoyo en camino" in chat[1]["text"]
    assert client.post("/api/transit/operations-chat", json={"message": "  "}, headers=h).status_code == 400

    # Un pasajero no accede al panel de conductor
    assert client.get("/api/transit/checklist", headers=auth(passenger["token"])).status_code == 403


def test_products_page(client):
    data = client.get("/api/products").get_json()
    assert len(data["data"]) == 3 and data["meta"]["totalPages"] == 1


def test_route_vehicles_live(client):
    data = client.get("/api/transit/routes/caracas-b75/vehicles").get_json()["data"]
    assert data["secondsPerStop"] > 0 and len(data["vehicles"]) == 4
    services = {v["vehicleId"]: v["service"] for v in data["vehicles"]}
    assert services["vagon-01"] == "Expreso" and services["vagon-03"] == "Corriente"
    bus = data["vehicles"][0]
    assert len(bus["upcomingStops"]) == 5 and bus["upcomingStops"][0]["name"] == bus["nextStation"]
    assert {"position", "atStation", "label", "currentStation"} <= set(bus)


def test_station_arrivals(client):
    s = {st["name"]: st for st in _stations(client)}
    flores = client.get(f"/api/transit/stations/{s['Flores']['id']}/arrivals").get_json()["data"]
    assert flores["station"]["name"] == "Flores"
    assert flores["arrivals"] and all(a["service"] == "Corriente" for a in flores["arrivals"])
    calle76 = client.get(f"/api/transit/stations/{s['Calle 76']['id']}/arrivals").get_json()["data"]
    assert len(calle76["arrivals"]) == 4
    etas = [a["etaSeconds"] for a in calle76["arrivals"]]
    assert etas == sorted(etas)
    assert client.get("/api/transit/stations/999999/arrivals").status_code == 404


def test_operator_assigned_bus(client, driver, passenger):
    res = client.get("/api/transit/my-vehicle", headers=auth(driver["token"]))
    assert res.status_code == 200 and res.get_json()["data"]["vehicleId"] == "vagon-02"
    assert client.get("/api/transit/my-vehicle", headers=auth(passenger["token"])).status_code == 403


def test_trips_paid_with_tullave(client, passenger):
    h = auth(passenger["token"])
    s = {st["name"]: st["id"] for st in _stations(client)}
    body = {"fromStationId": s["Calle 76"], "toStationId": s["Portal Tunal"]}

    broke = client.post("/api/trips", json=body, headers=h)
    assert broke.status_code == 400 and "Saldo insuficiente" in broke.get_json()["message"]

    client.post("/api/wallet/recharge", json={"amount": 10000}, headers=h)
    res = client.post("/api/trips", json=body, headers=h)
    trip = res.get_json()["data"]
    assert res.status_code == 201
    assert trip["fromName"] == "Calle 76" and trip["toName"] == "Portal Tunal"
    assert trip["service"] == "Expreso" and trip["fare"] == 3200 and trip["balance"] == 6800

    assert client.get("/api/wallet", headers=h).get_json()["data"]["balance"] == 6800
    tx = client.get("/api/wallet/transactions", headers=h).get_json()["data"]
    assert [t["type"] for t in tx] == ["fare", "recharge"]
    assert tx[0]["description"] == "Pasaje Calle 76 → Portal Tunal" and tx[0]["balanceAfter"] == 6800
    trips = client.get("/api/trips", headers=h).get_json()["data"]
    assert len(trips) == 1 and trips[0]["toName"] == "Portal Tunal"

    same = client.post("/api/trips", json={"fromStationId": s["Flores"], "toStationId": s["Flores"]}, headers=h)
    assert same.status_code == 400
    assert client.post("/api/trips", json=body).status_code == 401


def test_favorites(client, passenger):
    h = auth(passenger["token"])
    s = {st["name"]: st["id"] for st in _stations(client)}
    assert client.get("/api/users/me/favorites", headers=h).get_json()["data"] == []
    assert client.put(f"/api/users/me/favorites/{s['Marly']}", headers=h).get_json()["data"] == [s["Marly"]]
    client.put(f"/api/users/me/favorites/{s['Marly']}", headers=h)  # idempotente
    client.put(f"/api/users/me/favorites/{s['Calle 26']}", headers=h)
    assert client.get("/api/users/me/favorites", headers=h).get_json()["data"] == [s["Marly"], s["Calle 26"]]
    assert client.delete(f"/api/users/me/favorites/{s['Marly']}", headers=h).get_json()["data"] == [s["Calle 26"]]
    assert client.put("/api/users/me/favorites/999999", headers=h).status_code == 404


def test_incident_categories(client):
    assert set(client.get("/api/transit/incident-categories").get_json()["data"]) == {
        "Falla mecánica", "Seguridad", "Vía / tráfico", "Aglomeración"}


def test_active_trip_lifecycle(client, passenger):
    h = auth(passenger["token"])
    s = {st["name"]: st["id"] for st in _stations(client)}
    assert client.get("/api/trips/active", headers=h).get_json()["data"] is None

    client.post("/api/wallet/recharge", json={"amount": 20000}, headers=h)
    first = client.post("/api/trips", json={"fromStationId": s["Calle 63"], "toStationId": s["Flores"]},
                        headers=h).get_json()["data"]
    assert first["estimatedMinutes"] >= 1 and first["arrivesAt"] > first["startedAt"]

    active = client.get("/api/trips/active", headers=h).get_json()["data"]
    assert active["id"] == first["id"] and active["toName"] == "Flores"

    # pagar otro viaje cierra el anterior
    second = client.post("/api/trips", json={"fromStationId": s["Calle 76"], "toStationId": s["Calle 26"]},
                         headers=h).get_json()["data"]
    assert client.get("/api/trips/active", headers=h).get_json()["data"]["id"] == second["id"]
    trips = client.get("/api/trips", headers=h).get_json()["data"]
    assert trips[1]["endedAt"] is not None and trips[0]["endedAt"] is None

    assert client.post(f"/api/trips/{second['id']}/finish", headers=h).status_code == 200
    assert client.get("/api/trips/active", headers=h).get_json()["data"] is None
    assert client.post(f"/api/trips/{second['id']}/finish", headers=h).status_code == 404


def test_cannot_finish_someone_elses_trip(client, passenger):
    other = register(client, email="otra@example.com")
    s = {st["name"]: st["id"] for st in _stations(client)}
    h = auth(passenger["token"])
    client.post("/api/wallet/recharge", json={"amount": 5000}, headers=h)
    trip = client.post("/api/trips", json={"fromStationId": s["Calle 63"], "toStationId": s["Flores"]},
                       headers=h).get_json()["data"]
    assert client.post(f"/api/trips/{trip['id']}/finish", headers=auth(other["token"])).status_code == 404


def test_notifications_read_state(client, passenger):
    h = auth(passenger["token"])
    client.post("/api/wallet/recharge", json={"amount": 5000}, headers=h)
    client.post("/api/wallet/recharge", json={"amount": 5000}, headers=h)
    res = client.get("/api/notifications", headers=h).get_json()
    assert res["meta"]["unreadCount"] == 2
    first = next(n for n in res["data"] if n["unread"])

    marked = client.post(f"/api/notifications/{first['id']}/read", headers=h)
    assert marked.status_code == 200 and marked.get_json()["data"]["unreadCount"] == 1
    assert client.post(f"/api/notifications/{first['id']}/read", headers=h).status_code == 404

    assert client.post("/api/notifications/read-all", headers=h).get_json()["data"]["updated"] == 1
    assert client.get("/api/notifications", headers=h).get_json()["meta"]["unreadCount"] == 0
    assert client.get("/api/notifications").get_json()["meta"]["unreadCount"] == 0
    assert client.post("/api/notifications/read-all").status_code == 401


def test_preferences(client, passenger):
    h = auth(passenger["token"])
    assert client.get("/api/users/me/preferences", headers=h).get_json()["data"] == {
        "theme": "dark", "notifyArrivals": True, "notifyNews": True}
    res = client.put("/api/users/me/preferences", json={"theme": "light", "notifyNews": False}, headers=h)
    assert res.get_json()["data"] == {"theme": "light", "notifyArrivals": True, "notifyNews": False}
    assert client.put("/api/users/me/preferences", json={"theme": "rosa"}, headers=h).status_code == 400
    assert client.put("/api/users/me/preferences", json={"notifyNews": "no"}, headers=h).status_code == 400
    assert client.put("/api/users/me/preferences", json={}, headers=h).status_code == 400
