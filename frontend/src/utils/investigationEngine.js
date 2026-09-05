/* =========================================================
   CHRONOGRAPH INVESTIGATION ENGINE
========================================================= */

/**
 * Find supporting events that may explain an unexplained gap.
 */
export function findSupportingEvidence(gap, events = []) {
  if (!gap || !Array.isArray(events)) {
    return [];
  }

  const gapStart = new Date(gap.from.timestamp);
  const gapEnd = new Date(gap.to.timestamp);

  if (
    Number.isNaN(gapStart.getTime()) ||
    Number.isNaN(gapEnd.getTime())
  ) {
    return [];
  }

  const candidates = events
    .filter((event) => {
      // Do not use the two events that already define the gap.
      if (
        event.event_id === gap.from.event_id ||
        event.event_id === gap.to.event_id
      ) {
        return false;
      }

      const eventTime = new Date(event.timestamp);

      if (Number.isNaN(eventTime.getTime())) {
        return false;
      }

      /*
       * Search for events around the gap.
       * We allow a 60-minute window before and after.
       */
      const minutesFromStart =
        Math.abs((eventTime - gapStart) / 60000);

      const minutesFromEnd =
        Math.abs((eventTime - gapEnd) / 60000);

      return (
        minutesFromStart <= 60 ||
        minutesFromEnd <= 60
      );
    })
    .map((event) => {
      let score = 40;

      const text = `
        ${event.title || ""}
        ${event.description || ""}
        ${event.event_type || ""}
        ${event.source || ""}
      `.toLowerCase();

      /* Context relevance */
      const keywords = [
        "migration",
        "infrastructure",
        "configuration",
        "config",
        "deployment",
        "deploy",
        "cloud",
        "update",
        "release",
        "production",
      ];

      keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += 5;
        }
      });

      /* Source diversity */
      if (
        event.source &&
        event.source !== gap.from.source &&
        event.source !== gap.to.source
      ) {
        score += 8;
      }

      return {
        ...event,
        score: Math.min(score, 99),
      };
    })
    .filter((event) => event.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return candidates;
}


/**
 * Generate a root-cause hypothesis from the gap
 * and available supporting evidence.
 */
export function generateHypothesis(
  gap,
  candidates = []
) {
  if (!gap) {
    return {
      title: "Insufficient evidence",
      explanation:
        "ChronoGraph does not have enough temporal evidence to construct a hypothesis.",
      confidence: 0,
      signals: [],
    };
  }

  if (candidates.length === 0) {
    return {
      title: "Evidence gap remains unresolved",
      explanation:
        "No supporting event was found near the unexplained transition. Additional evidence sources may be required.",
      confidence: 32,
      signals: [
        "No nearby supporting event",
        "Cross-source transition detected",
        "External evidence may be required",
      ],
    };
  }

  const strongest = candidates[0];

  const text = `
    ${gap.from.title || ""}
    ${gap.to.title || ""}
    ${strongest.title || ""}
    ${strongest.description || ""}
    ${strongest.event_type || ""}
  `.toLowerCase();

  let title = "Possible operational transition";

  if (
    text.includes("migration") ||
    text.includes("infrastructure") ||
    text.includes("cloud")
  ) {
    title =
      "Infrastructure migration activity likely occurred";
  }

  if (
    text.includes("configuration") ||
    text.includes("config") ||
    text.includes("update")
  ) {
    title =
      "Configuration change likely explains the transition";
  }

  if (
    text.includes("deploy") ||
    text.includes("deployment") ||
    text.includes("release")
  ) {
    title =
      "Deployment activity may explain the transition";
  }

  const confidence = Math.min(
    96,
    Math.max(
      55,
      Number(strongest.score || 0) + 8
    )
  );

  const signals = [
    `${strongest.source} evidence occurs near the unexplained interval`,
    "Temporal distance supports a possible relationship",
    "Event context overlaps with the surrounding sequence",
  ];

  if (
    strongest.source !== gap.from.source &&
    strongest.source !== gap.to.source
  ) {
    signals.push(
      "Independent evidence source strengthens correlation"
    );
  }

  return {
    title,

    explanation:
      `The available evidence suggests that "${strongest.title}" ` +
      `may help explain the ${gap.minutes}-minute transition ` +
      `between "${gap.from.title}" and "${gap.to.title}". ` +
      `This is a hypothesis rather than a confirmed conclusion.`,

    confidence,

    signals,
  };
}