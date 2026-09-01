from neo4j import GraphDatabase
from app.core.config import settings

_driver = None


def get_driver():
    global _driver

    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(
                settings.neo4j_username,
                settings.neo4j_password
            )
        )

    return _driver


def close_driver():
    global _driver

    if _driver:
        _driver.close()
        _driver = None


def neo4j_connection():
    return get_driver()