import { useEffect, useMemo, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Clock3,
} from "lucide-react";

function getEventId(event) {
  return event?.id || event?.event_id || "UNKNOWN";
}

function getEventTitle(event) {
  return event?.title || event?.name || "Untitled Event";
}

function getEventSource(event) {
  return event?.source || "System";
}

function getEventDescription(event) {
  return (
    event?.description ||
    "No description available."
  );
}

function getEventType(event) {
  return event?.event_type || "Evidence Event";
}

function getDate(timestamp) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatTime(timestamp) {
  const date = getDate(timestamp);

  if (!date) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function IncidentReplay({ events = [] }) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  // ---------------------------------------------------------
  // Sort events chronologically
  // ---------------------------------------------------------

  const sortedEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }

    return [...events]
      .filter((event) =>
        getDate(event?.timestamp)
      )
      .sort(
        (a, b) =>
          getDate(a.timestamp) -
          getDate(b.timestamp)
      );
  }, [events]);

  // ---------------------------------------------------------
  // Keep current index valid if backend data changes
  // ---------------------------------------------------------

  useEffect(() => {
    if (sortedEvents.length === 0) {
      setCurrentIndex(-1);
      setPlaying(false);
      return;
    }

    setCurrentIndex((index) => {
      if (index >= sortedEvents.length) {
        return sortedEvents.length - 1;
      }

      return index;
    });
  }, [sortedEvents.length]);

  // ---------------------------------------------------------
  // Replay timer
  // ---------------------------------------------------------

  useEffect(() => {
    if (!playing || sortedEvents.length === 0) {
      return;
    }

    if (
      currentIndex >=
      sortedEvents.length - 1
    ) {
      setPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((index) => index + 1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [
    playing,
    currentIndex,
    sortedEvents.length,
  ]);

  // ---------------------------------------------------------
  // Controls
  // ---------------------------------------------------------

  const startReplay = () => {
    if (sortedEvents.length === 0) {
      return;
    }

    setCurrentIndex(0);
    setPlaying(true);
  };

  const resetReplay = () => {
    setPlaying(false);
    setCurrentIndex(-1);
  };

  const nextEvent = () => {
    if (sortedEvents.length === 0) {
      return;
    }

    setCurrentIndex((index) => {
      if (index < 0) {
        return 0;
      }

      if (index >= sortedEvents.length - 1) {
        return index;
      }

      return index + 1;
    });

    setPlaying(false);
  };

  const toggleReplay = () => {
    if (sortedEvents.length === 0) {
      return;
    }

    if (currentIndex === -1) {
      startReplay();
      return;
    }

    if (
      currentIndex >=
      sortedEvents.length - 1
    ) {
      setCurrentIndex(0);
      setPlaying(true);
      return;
    }

    setPlaying((value) => !value);
  };

  // ---------------------------------------------------------
  // Active event
  // ---------------------------------------------------------

  const activeEvent =
    currentIndex >= 0
      ? sortedEvents[currentIndex]
      : null;

  // ---------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------

  if (sortedEvents.length === 0) {
    return (
      <section className="replay-panel">

        <div className="replay-header">

          <div>

            <p className="eyebrow">
              INCIDENT TIME MACHINE
            </p>

            <h2>
              Replay the incident
            </h2>

            <p>
              No timestamped evidence is currently
              available for replay.
            </p>

          </div>

          <div className="replay-clock">
            <Clock3 size={15} />
            --:--
          </div>

        </div>

      </section>
    );
  }

  return (
    <section className="replay-panel">

      {/* =========================
          HEADER
      ========================= */}

      <div className="replay-header">

        <div>

          <p className="eyebrow">
            INCIDENT TIME MACHINE
          </p>

          <h2>
            Replay the incident
          </h2>

          <p>
            Watch the evidence unfold in temporal order.
          </p>

        </div>

        <div className="replay-clock">

          <Clock3 size={15} />

          {activeEvent
            ? formatTime(activeEvent.timestamp)
            : "--:--"}

        </div>

      </div>


      {/* =========================
          TIMELINE
      ========================= */}

      <div className="replay-track">

        <div className="replay-line" />

        {sortedEvents.map((event, index) => {

          const active =
            index === currentIndex;

          const completed =
            currentIndex >= index;

          const eventId =
            getEventId(event);

          return (
            <div
              key={`${eventId}-${index}`}
              className={`replay-event ${
                active ? "active" : ""
              } ${
                completed ? "completed" : ""
              }`}
            >

              <div className="replay-node">
                <span />
              </div>

              <div className="replay-event-info">

                <span>
                  {formatTime(event.timestamp)}
                </span>

                <strong>
                  {getEventTitle(event)}
                </strong>

                <small>
                  {getEventSource(event)}
                </small>

              </div>

            </div>
          );
        })}

      </div>


      {/* =========================
          CURRENT EVIDENCE
      ========================= */}

      {activeEvent && (
        <div className="replay-observation">

          <span className="eyebrow">
            CURRENT EVIDENCE
          </span>

          <h3>
            {getEventTitle(activeEvent)}
          </h3>

          <p>
            {getEventDescription(activeEvent)}
          </p>

          <div className="replay-meta">

            <span>
              {getEventSource(activeEvent)}
            </span>

            <span>
              {getEventType(activeEvent)}
            </span>

            <span>
              {getEventId(activeEvent)}
            </span>

          </div>

        </div>
      )}


      {/* =========================
          CONTROLS
      ========================= */}

      <div className="replay-controls">

        <button
          type="button"
          onClick={resetReplay}
          title="Reset replay"
        >
          <RotateCcw size={15} />
          Reset
        </button>


        <button
          type="button"
          className="replay-primary"
          onClick={toggleReplay}
        >

          {playing ? (
            <>
              <Pause size={15} />
              Pause
            </>
          ) : (
            <>
              <Play size={15} />

              {currentIndex === -1
                ? "Play incident"
                : currentIndex >=
                    sortedEvents.length - 1
                  ? "Replay again"
                  : "Resume"}
            </>
          )}

        </button>


        <button
          type="button"
          onClick={nextEvent}
          disabled={
            currentIndex >=
            sortedEvents.length - 1
          }
        >
          <SkipForward size={15} />
          Next
        </button>

      </div>

    </section>
  );
}