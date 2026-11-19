"""Comandos de consola:  flask seed-demo-users"""
import click
from werkzeug.security import generate_password_hash

from .repositories import transit_repository, user_repository

DEMO_DRIVER_VEHICLE = "vagon-02"
DEMO_USERS = [
    ("Pasajero Demo", "pasajero@milenew.co", "Pasajero123", "user"),
    ("Conductor Demo", "conductor@milenew.co", "Conductor123", "driver"),
    ("Central Demo", "central@milenew.co", "Central123", "admin"),
]


def register_cli(app):
    @app.cli.command("seed-demo-users")
    def seed_demo_users():
        """Crea usuarios de prueba (pasajero y conductor) si no existen."""
        for name, email, password, role in DEMO_USERS:
            user = user_repository.get_auth_by_email(email)
            if user:
                click.echo(f"ya existe   {email}")
            else:
                user = user_repository.create(name, email, generate_password_hash(password), role)
                click.echo(f"creado      {email} / {password}  (rol {role})")
            if role == "driver" and transit_repository.assign_driver(DEMO_DRIVER_VEHICLE, user["id"]):
                click.echo(f"            bus asignado: {DEMO_DRIVER_VEHICLE}")

    @app.cli.command("create-user")
    @click.option("--name", prompt=True)
    @click.option("--email", prompt=True)
    @click.option("--role", type=click.Choice(["user", "driver", "admin"]), default="user", show_default=True)
    @click.password_option()
    def create_user(name, email, role, password):
        """Crea un usuario con el rol indicado."""
        user = user_repository.create(name, email, generate_password_hash(password), role)
        click.echo(f"creado {user['email']} (id {user['id']}, rol {user['role']})")

    @app.cli.command("assign-bus")
    @click.argument("email")
    @click.argument("vehicle_code")
    def assign_bus(email, vehicle_code):
        """Asigna un bus (p. ej. vagon-03) a un operador."""
        user = user_repository.get_auth_by_email(email)
        if not user or user["role"] not in ("driver", "admin"):
            raise click.ClickException("El usuario no existe o no es operador")
        if not transit_repository.assign_driver(vehicle_code, user["id"]):
            raise click.ClickException("Ese bus no existe")
        click.echo(f"{vehicle_code} asignado a {email}")
