"""Seed the configured Neo4j database with the ChronoGraph review case.

Run from the repository root:
    python seed_database.py

This script requires a valid backend/.env with Neo4j credentials.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.data.demo_data import EVENTS, RELATIONSHIPS  # noqa: E402
from app.db.neo4j import Neo4jDatabase  # noqa: E402


def seed_database():
    database = None
    try:
        print("=" * 60)
        print("CHRONOGRAPH - DATABASE SEED")
        print("=" * 60)
        database = Neo4jDatabase()
        print("\nConnecting to Neo4j...")
        if not database.verify_connection():
            raise RuntimeError("Neo4j connection failed.")
        print("OK - Neo4j connection successful.")

        for event in EVENTS:
            result = database.create_event(event)
            print(f"OK - {result['id']} | {result['title']}")

        for relation in RELATIONSHIPS:
            result = database.create_relationship(
                relation["source"], relation["target"], relation["relationship"]
            )
            print(
                f"OK - {result['source']} --[{result['relationship']}]--> {result['target']}"
            )

        saved_events = database.get_events()
        graph = database.get_graph()
        print(f"\nEvents in database: {len(saved_events)}")
        print(f"Relationships in database: {len(graph['relationships'])}")
        print("DATABASE SEED COMPLETE")
    except Exception as error:
        print("\nDATABASE ERROR")
        print(error)
        raise
    finally:
        if database:
            database.close()


if __name__ == "__main__":
    seed_database()
