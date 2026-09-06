import os

from dotenv import load_dotenv
from neo4j import GraphDatabase


load_dotenv()


class Neo4jDatabase:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.username = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")

        if not self.uri:
            raise ValueError("NEO4J_URI is not configured in .env")

        if not self.username:
            raise ValueError("NEO4J_USERNAME is not configured in .env")

        if not self.password:
            raise ValueError("NEO4J_PASSWORD is not configured in .env")

        self.driver = GraphDatabase.driver(
            self.uri,
            auth=(self.username, self.password)
        )

    def close(self):
        """Close the Neo4j driver."""
        self.driver.close()

    def verify_connection(self):
        """Verify that ChronoGraph can connect to Neo4j."""
        with self.driver.session() as session:
            result = session.run("RETURN 1 AS connected")
            record = result.single()

            return record["connected"] == 1

    def get_events(self):
        """Get all Event nodes."""
        query = """
        MATCH (e:Event)
        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp
        ORDER BY e.timestamp
        """

        with self.driver.session() as session:
            result = session.run(query)

            return [record.data() for record in result]

    def get_event(self, event_id):
        """Get one event by ID."""
        query = """
        MATCH (e:Event {id: $event_id})
        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                event_id=event_id
            )

            record = result.single()

            if not record:
                return None

            return record.data()

    def get_related_events(self, event_id):
        """Get events connected to the specified event."""
        query = """
        MATCH (e:Event {id: $event_id})-[r]-(related:Event)
        RETURN
            related.id AS id,
            related.source AS source,
            related.title AS title,
            related.description AS description,
            related.timestamp AS timestamp,
            type(r) AS relationship
        ORDER BY related.timestamp
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                event_id=event_id
            )

            return [record.data() for record in result]

    def create_event(self, event):
        """Create or update an Event node."""
        query = """
        MERGE (e:Event {id: $id})
        SET
            e.source = $source,
            e.title = $title,
            e.description = $description,
            e.timestamp = $timestamp

        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                id=event["id"],
                source=event.get("source"),
                title=event.get("title"),
                description=event.get("description", ""),
                timestamp=event.get("timestamp")
            )

            record = result.single()

            return record.data() if record else None

    def create_relationship(
        self,
        event_id,
        related_event_id,
        relationship="RELATED_TO"
    ):
        """Create a relationship between two Event nodes."""

        allowed_relationships = {
            "RELATED_TO",
            "CAUSED_BY",
            "LEADS_TO",
            "SUPPORTS",
            "CONTRADICTS",
            "PRECEDES"
        }

        if relationship not in allowed_relationships:
            raise ValueError(
                f"Invalid relationship type: {relationship}"
            )

        query = f"""
        MATCH (a:Event {{id: $event_id}})
        MATCH (b:Event {{id: $related_event_id}})
        MERGE (a)-[r:{relationship}]->(b)

        RETURN
            a.id AS from_id,
            b.id AS to_id,
            type(r) AS relationship
        """

        with self.driver.session() as session:
            result = session.run(
                query,
                event_id=event_id,
                related_event_id=related_event_id
            )

            record = result.single()

            return record.data() if record else None


# ---------------------------------------------------------
# CONNECTION TEST
# ---------------------------------------------------------

if __name__ == "__main__":

    print("=" * 60)
    print("CHRONOGRAPH - NEO4J CONNECTION TEST")
    print("=" * 60)

    database = None

    try:
        print("\nConnecting to Neo4j...")

        database = Neo4jDatabase()

        print("Neo4j driver created successfully.")

        print("\nTesting connection...")

        if database.verify_connection():
            print("SUCCESS: Connected to Neo4j!")

            print("\nTesting Event query...")

            events = database.get_events()

            print(f"Events found: {len(events)}")

            if events:
                for event in events:
                    print(event)
            else:
                print("No events found yet.")
                print("This is normal because the database is empty.")

        else:
            print("Connection verification failed.")

    except Exception as error:
        print("\nNEO4J CONNECTION ERROR")
        print("-" * 60)
        print(error)
        print("-" * 60)

    finally:
        if database:
            database.close()
            print("\nNeo4j connection closed.")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)