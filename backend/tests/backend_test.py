"""Backend tests for Manajemen Izin & Kegiatan Pegawai."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://staff-permit-hub.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ------------------------- Auth -------------------------
class TestAdminAuth:
    def test_login_ok(self, s):
        r = s.post(f"{API}/admin/login", json={"pin": "1234"})
        assert r.status_code == 200
        assert r.json() == {"ok": True}

    def test_login_wrong_pin(self, s):
        r = s.post(f"{API}/admin/login", json={"pin": "0000"})
        assert r.status_code == 401


# ------------------------- Employees -------------------------
class TestEmployees:
    def test_list_seed(self, s):
        r = s.get(f"{API}/employees")
        assert r.status_code == 200
        names = [e["name"] for e in r.json()]
        for n in ["Andi Saputra", "Siti Rahayu", "Budi Santoso", "Dewi Lestari"]:
            assert n in names

    def test_create_delete_persistence(self, s):
        r = s.post(f"{API}/employees", json={"name": "TEST_Pegawai_X"})
        assert r.status_code == 200
        eid = r.json()["id"]
        # verify list contains
        got = s.get(f"{API}/employees").json()
        assert any(e["id"] == eid for e in got)
        # delete
        r2 = s.delete(f"{API}/employees/{eid}")
        assert r2.status_code == 200
        got2 = s.get(f"{API}/employees").json()
        assert not any(e["id"] == eid for e in got2)
        # delete again -> 404
        assert s.delete(f"{API}/employees/{eid}").status_code == 404


# ------------------------- Activities -------------------------
class TestActivities:
    def test_list(self, s):
        r = s.get(f"{API}/activities")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_delete(self, s):
        r = s.post(f"{API}/activities", json={"name": "TEST_ActX"})
        assert r.status_code == 200
        aid = r.json()["id"]
        assert any(a["id"] == aid for a in s.get(f"{API}/activities").json())
        assert s.delete(f"{API}/activities/{aid}").status_code == 200
        assert not any(a["id"] == aid for a in s.get(f"{API}/activities").json())


# ------------------------- Leaves -------------------------
class TestLeaves:
    @pytest.fixture(autouse=True)
    def setup(self, s):
        emps = s.get(f"{API}/employees").json()
        self.emp = next(e for e in emps if e["name"] == "Andi Saputra")

    def test_create_leave_default_pending(self, s):
        payload = {
            "employee_id": self.emp["id"],
            "type": "sakit",
            "start_date": "2026-01-10",
            "end_date": "2026-01-12",
            "notes": "TEST demam",
        }
        r = s.post(f"{API}/leaves", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "pending"
        assert d["employee_name"] == "Andi Saputra"
        assert d["type"] == "sakit"
        lid = d["id"]
        # approve
        r2 = s.patch(f"{API}/leaves/{lid}/status", json={"status": "approved"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "approved"
        # reports/absences includes 3 days for Andi
        rep = s.get(f"{API}/reports/absences").json()
        row = next(x for x in rep if x["employee_id"] == self.emp["id"])
        assert row["days"] >= 3
        assert row["count"] >= 1
        # delete
        assert s.delete(f"{API}/leaves/{lid}").status_code == 200

    def test_create_leave_invalid_employee(self, s):
        r = s.post(
            f"{API}/leaves",
            json={
                "employee_id": "does-not-exist",
                "type": "izin",
                "start_date": "2026-01-01",
                "end_date": "2026-01-01",
                "notes": "",
            },
        )
        assert r.status_code == 404

    def test_admin_leave_approved_direct(self, s):
        r = s.post(
            f"{API}/leaves",
            json={
                "employee_id": self.emp["id"],
                "type": "cuti",
                "start_date": "2026-02-01",
                "end_date": "2026-02-01",
                "notes": "TEST admin",
                "status": "approved",
            },
        )
        assert r.status_code == 200
        assert r.json()["status"] == "approved"
        s.delete(f"{API}/leaves/{r.json()['id']}")

    def test_filter_by_status_and_employee(self, s):
        r = s.post(
            f"{API}/leaves",
            json={
                "employee_id": self.emp["id"],
                "type": "izin",
                "start_date": "2026-03-01",
                "end_date": "2026-03-01",
                "notes": "TEST filter",
            },
        )
        lid = r.json()["id"]
        got = s.get(f"{API}/leaves", params={"employee_id": self.emp["id"], "status": "pending"}).json()
        assert any(x["id"] == lid for x in got)
        s.delete(f"{API}/leaves/{lid}")


# ------------------------- Activity logs -------------------------
class TestActivityLogs:
    @pytest.fixture(autouse=True)
    def setup(self, s):
        emps = s.get(f"{API}/employees").json()
        self.emp = next(e for e in emps if e["name"] == "Siti Rahayu")

    def test_create_and_approve(self, s):
        r = s.post(
            f"{API}/activity-logs",
            json={
                "employee_id": self.emp["id"],
                "activity_name": "TEST Survei",
                "date": "2026-01-15",
                "location": "TEST Loc",
                "notes": "",
            },
        )
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "pending"
        lid = d["id"]
        r2 = s.patch(f"{API}/activity-logs/{lid}/status", json={"status": "approved"})
        assert r2.status_code == 200
        rep = s.get(f"{API}/reports/activities").json()
        row = next(x for x in rep if x["employee_id"] == self.emp["id"])
        assert row["count"] >= 1
        s.delete(f"{API}/activity-logs/{lid}")

    def test_invalid_employee(self, s):
        r = s.post(
            f"{API}/activity-logs",
            json={
                "employee_id": "no-such",
                "activity_name": "X",
                "date": "2026-01-15",
                "location": "loc",
                "notes": "",
            },
        )
        assert r.status_code == 404


# ------------------------- Pending & reports -------------------------
class TestPending:
    def test_pending_shape(self, s):
        r = s.get(f"{API}/pending")
        assert r.status_code == 200
        j = r.json()
        assert "leaves" in j and "activities" in j
        for x in j["leaves"]:
            assert x["status"] == "pending"
        for x in j["activities"]:
            assert x["status"] == "pending"


class TestReports:
    def test_absences_shape(self, s):
        r = s.get(f"{API}/reports/absences")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        for row in rows:
            assert set(["employee_id", "name", "count", "days"]).issubset(row.keys())

    def test_activities_shape(self, s):
        r = s.get(f"{API}/reports/activities")
        assert r.status_code == 200
        rows = r.json()
        for row in rows:
            assert set(["employee_id", "name", "count"]).issubset(row.keys())
