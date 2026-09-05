export function generateHypothesis(gap, candidates = []) {
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

  let title = "Possible operational transition";

  const text = `
    ${gap.from.title}
    ${gap.to.title}
    ${strongest.title}
    ${strongest.description || ""}
    ${strongest.event_type || ""}
  `.toLowerCase();

  if (
    text.includes("migration") ||
    text.includes("infrastructure") ||
    text.includes("cloud")
  ) {
    title = "Infrastructure migration activity likely occurred";
  }

  if (
    text.includes("configuration") ||
    text.includes("config") ||
    text.includes("update")
  ) {
    title = "Configuration change likely explains the transition";
  }

  if (
    text.includes("deploy") ||
    text.includes("deployment")
  ) {
    title = "Deployment activity may explain the transition";
  }

  const confidence = Math.min(
    96,
    Math.max(
      55,
      strongest.score + 8
    )
  );

  const signals = [
    `${strongest.source} evidence occurs near the unexplained interval`,
    `Temporal distance supports a possible relationship`,
    `Event context overlaps with the surrounding sequence`,
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