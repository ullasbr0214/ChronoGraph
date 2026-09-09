from neo4j import GraphDatabase

from app.core.config import settings


class Neo4jDatabase:
    """Handles all communication between ChronoGraph and Neo4j."""

    # =========================================================
    # INITIALIZE
    # =========================================================

    def __init__(self):
        self.uri = settings.neo4j_uri
        self.username = settings.neo4j_username
        self.password = settings.neo4j_password

        if not self.uri:
            raise ValueError(
                "NEO4J_URI is not configured"
            )

        if not self.username:
            raise ValueError(
                "NEO4J_USERNAME is not configured"
            )

        if not self.password:
            raise ValueError(
                "NEO4J_PASSWORD is not configured"
            )

        self.driver = GraphDatabase.driver(
            self.uri,
            auth=(
                self.username,
                self.password,
            ),
        )

    # =========================================================
    # CLOSE
    # =========================================================

    def close(self):
        """Close the Neo4j driver."""

        if self.driver:
            self.driver.close()

    # =========================================================
    # VERIFY CONNECTION
    # =========================================================

    def verify_connection(self):
        """Verify that ChronoGraph can connect to Neo4j."""

        with self.driver.session() as session:

            result = session.run(
                "RETURN 1 AS connected"
            )

            record = result.single()

            return (
                record is not None
                and record["connected"] == 1
            )

    # =========================================================
    # GET ALL EVENTS
    # =========================================================

    def get_events(self):
        """
        Return all Event nodes ordered chronologically.
        """

        query = """
        MATCH (e:Event)

        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp,
            e.event_type AS event_type

        ORDER BY e.timestamp ASC
        """

        with self.driver.session() as session:

            result = session.run(query)

            return [
                record.data()
                for record in result
            ]

    # =========================================================
    # GET ONE EVENT
    # =========================================================

    def get_event(self, event_id):
        """
        Return a single Event node by ID.
        """

        if not event_id:
            return None

        query = """
        MATCH (e:Event {id: $event_id})

        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp,
            e.event_type AS event_type
        """

        with self.driver.session() as session:

            result = session.run(
                query,
                event_id=event_id,
            )

            record = result.single()

            if not record:
                return None

            return record.data()

    # =========================================================
    # GET RELATED EVENTS
    # =========================================================

    def get_related_events(self, event_id):
        """
        Return all Event nodes connected to the
        specified Event.

        Relationship direction is intentionally ignored
        here so both incoming and outgoing relationships
        are returned.
        """

        if not event_id:
            return []

        query = """
        MATCH (e:Event {id: $event_id})-[r]-(related:Event)

        RETURN
            related.id AS id,
            related.source AS source,
            related.title AS title,
            related.description AS description,
            related.timestamp AS timestamp,
            related.event_type AS event_type,
            type(r) AS relationship

        ORDER BY related.timestamp ASC
        """

        with self.driver.session() as session:

            result = session.run(
                query,
                event_id=event_id,
            )

            return [
                record.data()
                for record in result
            ]

    # =========================================================
    # GET COMPLETE GRAPH
    # =========================================================

    def get_graph(self):
        """
        Return the complete ChronoGraph graph.

        Includes:

        - Event nodes
        - Real Neo4j relationships
        - Relationship types

        No relationships are artificially generated.
        """

        nodes_query = """
        MATCH (e:Event)

        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp,
            e.event_type AS event_type

        ORDER BY e.timestamp ASC
        """

        relationships_query = """
        MATCH (a:Event)-[r]->(b:Event)

        RETURN
            a.id AS source,
            b.id AS target,
            type(r) AS relationship
        """

        with self.driver.session() as session:

            # -------------------------------------------------
            # NODES
            # -------------------------------------------------

            nodes_result = session.run(
                nodes_query
            )

            nodes = [
                record.data()
                for record in nodes_result
            ]

            # -------------------------------------------------
            # RELATIONSHIPS
            # -------------------------------------------------

            relationships_result = session.run(
                relationships_query
            )

            relationships = [
                record.data()
                for record in relationships_result
            ]

            return {
                "nodes": nodes,
                "relationships": relationships,
            }

    # =========================================================
    # CREATE / UPDATE EVENT
    # =========================================================

    def create_event(self, event):
        """
        Create or update an Event node.

        MERGE ensures that an existing event with the
        same ID is updated instead of duplicated.
        """

        if not event:
            raise ValueError(
                "Event data is required"
            )

        event_id = (
            event.get("id")
            or event.get("event_id")
        )

        if not event_id:
            raise ValueError(
                "Event ID is required"
            )

        query = """
        MERGE (e:Event {id: $id})

        SET
            e.source = $source,
            e.title = $title,
            e.description = $description,
            e.timestamp = $timestamp,
            e.event_type = $event_type

        RETURN
            e.id AS id,
            e.source AS source,
            e.title AS title,
            e.description AS description,
            e.timestamp AS timestamp,
            e.event_type AS event_type
        """

        with self.driver.session() as session:

            result = session.run(
                query,

                id=event_id,

                source=event.get(
                    "source"
                ),

                title=event.get(
                    "title"
                ),

                description=event.get(
                    "description",
                    "",
                ),

                timestamp=event.get(
                    "timestamp"
                ),

                event_type=event.get(
                    "event_type",
                    "Evidence Event",
                ),
            )

            record = result.single()

            return (
                record.data()
                if record
                else None
            )

    # =========================================================
    # CREATE RELATIONSHIP
    # =========================================================

    def create_relationship(
        self,
        event_id,
        related_event_id,
        relationship="RELATED_TO",
    ):
        """
        Create a directional relationship between
        two Event nodes.
        """

        if not event_id:
            raise ValueError(
                "Source event ID is required"
            )

        if not related_event_id:
            raise ValueError(
                "Target event ID is required"
            )

        if event_id == related_event_id:
            raise ValueError(
                "An event cannot be related to itself"
            )

        # -----------------------------------------------------
        # Allowed relationship types
        # -----------------------------------------------------

        allowed_relationships = {
            "RELATED_TO",
            "CAUSED_BY",
            "LEADS_TO",
            "SUPPORTS",
            "CONTRADICTS",
            "PRECEDES",
        }

        relationship = str(
            relationship or "RELATED_TO"
        ).upper()

        if relationship not in allowed_relationships:
            raise ValueError(
                f"Invalid relationship type: "
                f"{relationship}"
            )

        # -----------------------------------------------------
        # Relationship query
        # -----------------------------------------------------

        query = f"""
        MATCH (a:Event {{id: $event_id}})
        MATCH (b:Event {{id: $related_event_id}})

        MERGE (a)-[r:{relationship}]->(b)

        RETURN
            a.id AS source,
            b.id AS target,
            type(r) AS relationship
        """

        with self.driver.session() as session:

            result = session.run(
                query,

                event_id=event_id,

                related_event_id=related_event_id,
            )

            record = result.single()

            if not record:
                raise ValueError(
                    "One or both event IDs "
                    "were not found in Neo4j"
                )

            return record.data()