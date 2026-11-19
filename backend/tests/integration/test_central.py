from .conftest import auth


def test_only_admin_can_use_central(client, passenger, driver):
    for who in (None, passenger, driver):
        headers = auth(who["token"]) if who else {}
        assert client.get("/api/admin/summary", headers=headers).status_code in (401, 403)


def test_incident_inbox_and_reporter_notified(client, passenger, admin):
    h = auth(admin["token"])
    client.post("/api/transit/incidents", json={"category": "Seguridad", "description": "Pelea en el vagón"},
                headers=auth(passenger["token"]))
    client.post("/api/transit/incidents", json={"category": "Aglomeración"})

    summary = client.get("/api/admin/summary", headers=h).get_json()["data"]
    assert summary["openIncidents"] == 2 and summary["drivers"] == 1

    items = client.get("/api/admin/incidents?status=open", headers=h).get_json()["data"]
    mine = next(i for i in items if i["category"] == "Seguridad")
    assert mine["reporterName"] == "Ana" and next(i for i in items if i["category"] == "Aglomeración")["reporterName"] == "Anónimo"

    res = client.patch(f"/api/admin/incidents/{mine['id']}", json={"status": "in_progress"}, headers=h)
    assert res.get_json()["data"]["status"] == "in_progress"
    res = client.patch(f"/api/admin/incidents/{mine['id']}", json={"status": "closed", "note": "Policía en la estación"},
                       headers=h)
    assert res.get_json()["data"]["resolutionNote"] == "Policía en la estación"

    notes = client.get("/api/notifications", headers=auth(passenger["token"])).get_json()["data"]
    assert notes[0]["title"] == "Tu reporte fue atendido" and "Policía en la estación" in notes[0]["description"]

    assert client.patch("/api/admin/incidents/99999", json={"status": "closed"}, headers=h).status_code == 404
    assert client.patch(f"/api/admin/incidents/{mine['id']}", json={"status": "x"}, headers=h).status_code == 400
    assert client.get("/api/admin/incidents?status=x", headers=h).status_code == 400


def test_real_chat_between_central_and_operator(client, driver, admin):
    hd, ha = auth(driver["token"]), auth(admin["token"])
    client.post("/api/transit/operations-chat", json={"message": "Retraso leve"}, headers=hd)

    convs = client.get("/api/admin/conversations", headers=ha).get_json()["data"]
    conv = next(c for c in convs if c["driverName"] == "Conductor Demo")
    assert conv["unread"] == 1 and conv["lastText"] == "Retraso leve" and conv["vehicleLabel"] == "B75 · 7042"
    assert client.get("/api/admin/summary", headers=ha).get_json()["data"]["unreadMessages"] == 1

    msgs = client.get(f"/api/admin/conversations/{conv['driverId']}", headers=ha).get_json()["data"]
    assert [m["text"] for m in msgs] == ["Retraso leve"]
    assert client.get("/api/admin/summary", headers=ha).get_json()["data"]["unreadMessages"] == 0

    sent = client.post(f"/api/admin/conversations/{conv['driverId']}", json={"message": "Entendido, avisamos"},
                       headers=ha)
    assert sent.status_code == 201 and sent.get_json()["data"]["from"] == "central"
    chat = client.get("/api/transit/operations-chat", headers=hd).get_json()["data"]
    assert [m["from"] for m in chat] == ["driver", "central"]
    assert client.post("/api/admin/conversations/99999", json={"message": "x"}, headers=ha).status_code == 404


def test_fleet_assignment(client, driver, admin):
    ha = auth(admin["token"])
    fleet = client.get("/api/admin/fleet", headers=ha).get_json()["data"]
    driver_id = fleet["drivers"][0]["id"]
    assert next(v for v in fleet["vehicles"] if v["code"] == "vagon-02")["driverId"] == driver_id

    fleet = client.put("/api/admin/fleet/vagon-03/driver", json={"driverId": driver_id}, headers=ha).get_json()["data"]
    assigned = {v["code"]: v["driverId"] for v in fleet["vehicles"]}
    assert assigned["vagon-03"] == driver_id and assigned["vagon-02"] is None  # un operador, un bus
    assert client.get("/api/transit/my-vehicle", headers=auth(driver["token"])).get_json()["data"]["vehicleId"] == "vagon-03"

    client.put("/api/admin/fleet/vagon-03/driver", json={"driverId": None}, headers=ha)
    assert client.get("/api/transit/my-vehicle", headers=auth(driver["token"])).status_code == 404
    assert client.put("/api/admin/fleet/no-existe/driver", json={"driverId": None}, headers=ha).status_code == 404
    assert client.put("/api/admin/fleet/vagon-01/driver", json={"driverId": 99999}, headers=ha).status_code == 404


def test_notices(client, admin):
    ha = auth(admin["token"])
    before = len(client.get("/api/notifications").get_json()["data"])
    notice = client.post("/api/admin/notices", json={"title": "Cierre Calle 26", "description": "Desvío temporal"},
                         headers=ha).get_json()["data"]
    public = client.get("/api/notifications").get_json()["data"]
    assert len(public) == before + 1 and public[0]["title"] == "Cierre Calle 26"
    assert client.post("/api/admin/notices", json={"title": "x"}, headers=ha).status_code == 400
    assert client.delete(f"/api/admin/notices/{notice['id']}", headers=ha).status_code == 200
    assert client.delete(f"/api/admin/notices/{notice['id']}", headers=ha).status_code == 404
