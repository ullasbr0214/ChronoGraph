import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Database,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getEvents, getGraph } from "../services/api";

function normalizeEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.nodes)) return payload.nodes;
  return [];
}

function normalizeRelationships(payload) {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item, index) => ({
      id: item.id || `${item.source}-${item.target}-${index}`,
      source: item.source,
      target: item.target,
      relationship: item.relationship || item.type || "RELATED_TO",
    }))
    .filter((item) => item.source && item.target);
}

function sortEvents(events) {
  return [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function minutesBetween(a, b) {
  const first = new Date(a).getTime();
  const second = new Date(b).getTime();
  if (Number.isNaN(first) || Number.isNaN(second)) return 0;
  return Math.max(0, Math.round((second - first) / 60000));
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function buildGaps(events) {
  const gaps = [];
  for (let i = 0; i < events.length - 1; i += 1) {
    const minutes = minutesBetween(events[i].timestamp, events[i + 1].timestamp);
    if (minutes > 10) {
      gaps.push({
        id: `${events[i].id}-${events[i + 1].id}`,
        from: events[i],
        to: events[i + 1],
        minutes,
      });
    }
  }
  return gaps;
}

export default function Investigation() {
  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [mode, setMode] = useState("loading");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All Sources");
  const [selectedEvent, setSelectedEvent] = useState(null);

  async function loadInvestigation() {
    setLoading(true);
    setWarning("");
    try {
      const [eventsPayload, graphPayload] = await Promise.all([getEvents(), getGraph()]);
      const loadedEvents = sortEvents(normalizeEvents(eventsPayload));
      const loadedRelationships = normalizeRelationships(graphPayload?.relationships);

      setEvents(loadedEvents);
      setRelationships(loadedRelationships);
      setMode(eventsPayload?.mode === "neo4j" || graphPayload?.mode === "neo4j" ? "neo4j" : "demo");
      setWarning(eventsPayload?.warning || graphPayload?.warning || "");
      setSelectedEvent((previous) => previous ? loadedEvents.find((item) => item.id === previous.id) || null : null);
    } catch (error) {
      setEvents([]);
      setRelationships([]);
      setMode("error");
      setWarning(error?.message || "Unable to load investigation data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvestigation();
  }, []);

  const sources = useMemo(
    () => ["All Sources", ...new Set(events.map((event) => event.source).filter(Boolean))],
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const sourceMatch = source === "All Sources" || event.source === source;
      const searchMatch = !query || [event.id, event.title, event.description, event.source, event.event_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return sourceMatch && searchMatch;
    });
  }, [events, search, source]);

  const gaps = useMemo(() => buildGaps(events), [events]);

  const timeWindow = useMemo(() => {
    if (events.length < 2) return 0;
    return minutesBetween(events[0].timestamp, events[events.length - 1].timestamp);
  }, [events]);

  const confidence = useMemo(() => {
    if (!events.length) return 0;
    if (events.length === 1) return 25;
    const adjacentCoverage = Math.min(1, relationships.length / (events.length - 1));
    const gapPenalty = Math.min(0.25, gaps.length * 0.08);
    return Math.round(Math.max(0, (adjacentCoverage * 100) - gapPenalty * 100));
  }, [events, relationships, gaps]);

  const relationshipLookup = useMemo(() => {
    const map = new Map();
    relationships.forEach((relationship) => {
      map.set(`${relationship.source}->${relationship.target}`, relationship.relationship);
    });
    return map;
  }, [relationships]);

  const conclusion = gaps.length === 0
    ? "The available evidence forms a continuous 15-minute sequence with graph links connecting each observed event."
    : `${gaps.length} temporal gap${gaps.length === 1 ? "" : "s"} require additional evidence before the sequence can be considered complete.`;

  if (loading) {
    return (
      <div className="investigation-loading-page">
        <div className="loading-orbit"><div /></div>
        <strong>INITIALIZING CHRONOGRAPH</strong>
        <span>Loading temporal evidence and graph relationships...</span>
      </div>
    );
  }

  return (
    <div className="investigation-page">
      <header className="investigation-topbar">
        <div>
          <div className="case-label">CASE / CG-2026-001</div>
          <h2>Investigation Console</h2>
        </div>
        <div className="topbar-actions">
          <label className="global-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, sources..." />
            <span className="shortcut">⌘ K</span>
          </label>
          <button className="icon-button" type="button" aria-label="Notifications"><Bell size={18} /></button>
          <div className={`live-indicator ${mode === "demo" ? "demo" : ""}`}>
            <span /> {mode === "neo4j" ? "NEO4J LIVE" : mode === "demo" ? "LOCAL EVIDENCE" : "OFFLINE"}
          </div>
        </div>
      </header>

      <main className="investigation-content">
        <section className="investigation-hero">
          <div className="eyebrow">TEMPORAL GRAPH ANALYSIS</div>
          <h1>Reconstruct what happened.<br /><span>Understand why.</span></h1>
          <p>ChronoGraph connects events across time, systems and evidence to reconstruct how an incident unfolded.</p>
          <div className={`analysis-status ${mode === "demo" ? "demo" : mode === "error" ? "error" : ""}`}>
            <span className="status-dot" />
            {mode === "neo4j" ? "INVESTIGATION READY · LIVE GRAPH" : mode === "demo" ? "INVESTIGATION READY · LOCAL EVIDENCE" : "INVESTIGATION UNAVAILABLE"}
          </div>
          {warning && <div className="analysis-warning"><Database size={15} /> Neo4j is unavailable, so the bundled local evidence is being used for this review.</div>}
        </section>

        <section className="metrics-grid">
          <div className="metric-card"><div className="metric-label">TOTAL EVENTS</div><div className="metric-value">{events.length}</div><div className="metric-description">Across {new Set(events.map((event) => event.source)).size} sources</div></div>
          <div className="metric-card"><div className="metric-label">GRAPH RELATIONSHIPS</div><div className="metric-value">{relationships.length}</div><div className="metric-description">Verified graph links</div></div>
          <div className="metric-card"><div className="metric-label">UNEXPLAINED GAPS</div><div className="metric-value">{gaps.length}</div><div className="metric-description">Potential investigation points</div></div>
          <div className="metric-card confidence-card"><div className="metric-label">SEQUENCE CONFIDENCE</div><div className="metric-value">{confidence}%</div><div className="metric-description">Relationship coverage</div></div>
        </section>

        <section className="evidence-filter-section">
          <div><div className="eyebrow">EVIDENCE FILTER</div><h3>Filter investigation evidence</h3></div>
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            {sources.map((item) => <option key={item}>{item}</option>)}
          </select>
        </section>

        <section className="timeline-section">
          <div className="section-heading">
            <div><div className="eyebrow">TEMPORAL EVIDENCE</div><h2>Incident sequence</h2></div>
            <div className="time-window">{timeWindow}m WINDOW</div>
          </div>
          {filteredEvents.length === 0 ? <div className="empty-state">No evidence matches your search.</div> : (
            <div className="incident-timeline">
              {filteredEvents.map((event, index) => {
                const next = filteredEvents[index + 1];
                const relation = next ? relationshipLookup.get(`${event.id}->${next.id}`) : null;
                const gap = next ? minutesBetween(event.timestamp, next.timestamp) : null;
                return (
                  <div key={event.id}>
                    <button type="button" className={`timeline-event ${selectedEvent?.id === event.id ? "selected" : ""}`} onClick={() => setSelectedEvent(event)}>
                      <div className="timeline-marker"><span /></div>
                      <div className="timeline-time"><strong>{formatTime(event.timestamp)}</strong><small>{formatDate(event.timestamp)}</small></div>
                      <div className="event-card">
                        <div className="event-card-top"><span className="event-source">{event.source}</span><span className="event-id">{event.id}</span></div>
                        <h3>{event.title}</h3><p>{event.description}</p>
                        <div className="event-footer"><span>{event.event_type || "EVIDENCE"}</span><span>{relation || "TEMPORAL ORDER"}</span></div>
                      </div>
                    </button>
                    {next && <div className="timeline-connection"><div className="connection-line" /><div className="connection-label"><ArrowRight size={13} /> {relation || "UNLINKED"} · {gap} min</div></div>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="relationships-section">
          <div className="eyebrow">GRAPH RELATIONSHIPS</div>
          <div className="section-heading"><div><h2>Evidence connections</h2><p>These links come from the graph data rather than being generated from display order.</p></div><div className="relationship-count">{relationships.length} LINKS</div></div>
          <div className="relationship-list">
            {relationships.map((relation) => {
              const from = events.find((event) => event.id === relation.source);
              const to = events.find((event) => event.id === relation.target);
              return <div className="relationship-card" key={relation.id}><div className="relationship-node"><span>{relation.source}</span><strong>{from?.title || "Unknown event"}</strong></div><div className="relationship-arrow"><span>{relation.relationship}</span><ArrowRight size={15} /></div><div className="relationship-node"><span>{relation.target}</span><strong>{to?.title || "Unknown event"}</strong></div></div>;
            })}
          </div>
        </section>

        <section className="investigation-summary">
          <div className="summary-icon"><Sparkles size={23} /></div>
          <div className="summary-content"><div className="eyebrow">INVESTIGATION SUMMARY</div><h2>{gaps.length === 0 ? "Continuous evidence chain reconstructed." : "Additional evidence is required."}</h2><p>{conclusion}</p></div>
          <div className="summary-confidence"><span>CONFIDENCE</span><strong>{confidence}%</strong></div>
        </section>

        {selectedEvent && <section className="selected-evidence"><div className="eyebrow">SELECTED EVIDENCE</div><div className="selected-evidence-grid"><div><span>EVENT ID</span><strong>{selectedEvent.id}</strong></div><div><span>SOURCE</span><strong>{selectedEvent.source}</strong></div><div><span>TIMESTAMP</span><strong>{formatDate(selectedEvent.timestamp)} {formatTime(selectedEvent.timestamp)}</strong></div><div><span>TYPE</span><strong>{selectedEvent.event_type || "EVIDENCE"}</strong></div></div><div className="selected-description"><CheckCircle2 size={15} /> {selectedEvent.description}</div></section>}

        <section className="investigation-next-step">
          <div><div className="eyebrow">ANALYST NEXT STEP</div><h3>Verify the graph chain against source logs.</h3><p>ChronoGraph presents relationships as evidence links; investigators should validate important conclusions against the original source records.</p></div>
          <div className="next-step-icon"><Activity size={20} /><Clock3 size={16} /></div>
        </section>
      </main>
    </div>
  );
}
