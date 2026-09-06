from neo4j_database import Neo4jDatabase


def seed_database():
    database = None

    try:
        print("=" * 60)
        print("CHRONOGRAPH - DATABASE SEED")
        print("=" * 60)

        database = Neo4jDatabase()

        print("\nConnecting to Neo4j...")

        if not database.verify_connection():
            print("❌ Neo4j connection failed.")
            return

        print("✅ Neo4j connection successful.")

        # -------------------------------------------------
        # CREATE EVENTS
        # -------------------------------------------------

        events = [
            {
                "id": "EVT-001",
                "source": "System Log",
                "title": "Login Attempt",
                "description": "A user login attempt was detected.",
                "timestamp": "2026-09-06T09:00:00"
            },
            {
                "id": "EVT-002",
                "source": "Security Log",
                "title": "Multiple Failed Logins",
                "description": "Multiple failed login attempts were detected.",
                "timestamp": "2026-09-06T09:05:00"
            },
            {
                "id": "EVT-003",
                "source": "Network Log",
                "title": "Unknown IP Connection",
                "description": "A connection was detected from an unknown IP address.",
                "timestamp": "2026-09-06T09:10:00"
            },
            {
                "id": "EVT-004",
                "source": "Application Log",
                "title": "Account Access",
                "description": "The account was accessed after the suspicious connection.",
                "timestamp": "2026-09-06T09:15:00"
            }
        ]

        print("\nCreating events...")

        for event in events:
            result = database.create_event(event)

            print(
                f"✅ {result['id']} | "
                f"{result['title']}"
            )

        # -------------------------------------------------
        # CREATE RELATIONSHIPS
        # -------------------------------------------------

        relationships = [
            ("EVT-001", "EVT-002", "LEADS_TO"),
            ("EVT-002", "EVT-003", "CAUSED_BY"),
            ("EVT-003", "EVT-004", "LEADS_TO")
        ]

        print("\nCreating relationships...")

        for from_id, to_id, relationship in relationships:

            result = database.create_relationship(
                from_id,
                to_id,
                relationship
            )

            if result:
                print(
                    f"✅ {from_id} "
                    f"--[{relationship}]--> "
                    f"{to_id}"
                )
            else:
                print(
                    f"❌ Could not create relationship "
                    f"{from_id} -> {to_id}"
                )

        # -------------------------------------------------
        # VERIFY DATA
        # -------------------------------------------------

        print("\nReading events from Neo4j...")

        saved_events = database.get_events()

        print(
            f"\n✅ Total events in database: "
            f"{len(saved_events)}"
        )

        for event in saved_events:
            print(
                f"\nID: {event['id']}"
                f"\nTitle: {event['title']}"
                f"\nSource: {event['source']}"
                f"\nTimestamp: {event['timestamp']}"
            )

        print("\n" + "=" * 60)
        print("DATABASE SEED COMPLETE")
        print("=" * 60)

    except Exception as error:

        print("\n❌ DATABASE ERROR")
        print("-" * 60)
        print(error)
        print("-" * 60)

    finally:

        if database:
            database.close()
            print("\nNeo4j connection closed.")


if __name__ == "__main__":
    seed_database()