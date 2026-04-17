import type { Match, Participant } from "~/lib/firebase/tournament-service";

export const SET_COLORS = [
  "bg-blue-200 text-blue-700",
  "bg-green-200 text-green-700",
  "bg-yellow-200 text-yellow-700",
  "bg-purple-200 text-purple-700",
  "bg-orange-200 text-orange-700",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const BracketParticipantRow = ({
  participant,
}: {
  participant: Participant | null | undefined;
}) => (
  <div
    className={`flex items-center justify-between gap-1 py-0.5 ${
      participant?.isWinner ? "font-bold" : ""
    }`}
  >
    <span className="truncate flex-1 text-gray-800 text-[11px]">
      {participant?.name || "TBD"}
    </span>
    <div className="flex gap-0.5 shrink-0">
      {(participant?.resultText || "-").split("|").map((score, i) => (
        <span
          key={i}
          className={`text-[10px] px-1 py-0.5 rounded ${SET_COLORS[i % SET_COLORS.length]}`}
        >
          {score}
        </span>
      ))}
    </div>
  </div>
);

const BracketMatchCard = ({ match }: { match: Match }) => {
  const home = match.participants[0] as Participant | undefined;
  const away = match.participants[1] as Participant | undefined;

  const borderColor =
    match.state === "LIVE"
      ? "border-red-400"
      : match.state === "DONE"
        ? "border-gray-300"
        : "border-blue-200";

  return (
    <div
      className={`border-2 ${borderColor} rounded-lg bg-white px-2 py-1.5 shadow-sm w-full`}
    >
      {match.state === "LIVE" && (
        <div className="flex items-center gap-1 mb-1">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-red-500 font-semibold tracking-wide">
            LIVE
          </span>
        </div>
      )}
      <BracketParticipantRow participant={home} />
      <div className="my-0.5 border-t border-gray-100" />
      <BracketParticipantRow participant={away} />
    </div>
  );
};

// ─── Bracket logic ────────────────────────────────────────────────────────────

function buildBracketRounds(matches: Match[]): {
  rounds: Match[][];
  thirdPlace: Match | null;
} {
  if (matches.length === 0) return { rounds: [], thirdPlace: null };

  // nextMatchId can reference the Firebase key (match.id) OR the backend
  // integer matchId — build both lookup maps to handle either format.
  const byFirebaseKey = new Map<string, Match>();
  const byMatchId = new Map<string, Match>();
  matches.forEach((m) => {
    byFirebaseKey.set(m.id, m);
    if (m.matchId != null) byMatchId.set(String(m.matchId), m);
  });

  // Resolve nextMatchId → Firebase key. Returns null if empty / unresolvable.
  const resolveNextId = (m: Match): string | null => {
    if (m.nextMatchId == null || m.nextMatchId === "") return null;
    const raw = String(m.nextMatchId);
    if (byFirebaseKey.has(raw)) return raw;
    return byMatchId.get(raw)?.id ?? null;
  };

  // Tree size = how many matches eventually feed into this one (inclusive).
  const getTreeSize = (id: string, visited = new Set<string>()): number => {
    if (visited.has(id)) return 0;
    visited.add(id);
    const children = matches.filter((m) => resolveNextId(m) === id);
    return 1 + children.reduce((s, c) => s + getTreeSize(c.id, visited), 0);
  };

  // Final = match with the largest tree (not necessarily a root — it IS
  // referenced by SF matches, so root-based logic breaks here).
  const finalMatch =
    matches
      .map((m) => ({ match: m, size: getTreeSize(m.id) }))
      .sort((a, b) => b.size - a.size)[0]?.match ?? null;

  if (!finalMatch) return { rounds: [], thirdPlace: null };

  // Collect every match id that belongs to the main bracket tree.
  const finalBranchIds = new Set<string>();
  const collectBranch = (id: string) => {
    if (finalBranchIds.has(id)) return;
    finalBranchIds.add(id);
    matches.filter((m) => resolveNextId(m) === id).forEach((c) => collectBranch(c.id));
  };
  collectBranch(finalMatch.id);

  // 3rd place = a match whose nextMatchId is unresolvable AND is outside the
  // main bracket tree (e.g. nextMatchId "0" that references nothing).
  const thirdPlace =
    matches.find((m) => resolveNextId(m) === null && !finalBranchIds.has(m.id)) ??
    null;

  // BFS from final to assign depths (final = 0, earlier rounds = larger).
  const roundOf = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: finalMatch.id, depth: 0 },
  ];
  while (queue.length > 0) {
    const item = queue.shift()!;
    roundOf.set(item.id, item.depth);
    matches
      .filter((m) => resolveNextId(m) === item.id)
      .forEach((c) => queue.push({ id: c.id, depth: item.depth + 1 }));
  }

  const maxDepth = Math.max(...Array.from(roundOf.values()));

  // Invert: depth 0 (final) → last (rightmost) column.
  const rounds: Match[][] = Array.from({ length: maxDepth + 1 }, () => []);
  roundOf.forEach((depth, id) => {
    const match = byFirebaseKey.get(id);
    if (match) rounds[maxDepth - depth].push(match);
  });

  rounds.forEach((round) =>
    round.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0)),
  );

  return { rounds, thirdPlace };
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_W = 168; // px — must match BracketMatchCard width
const SLOT_H = 88; // px — height of each match slot in the first round
const CONN_W = 28; // px — width of connector column

// ─── Main component ───────────────────────────────────────────────────────────

export const TournamentBracket = ({ matches }: { matches: Match[] }) => {
  const { rounds, thirdPlace } = buildBracketRounds(matches);

  if (rounds.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">
        No bracket data available
      </p>
    );
  }

  const firstRoundCount = rounds[0].length;
  const totalH = firstRoundCount * SLOT_H;

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      {/* Round labels */}
      <div className="flex mb-2" style={{ minWidth: "max-content" }}>
        {rounds.map((roundMatches, rIdx) => (
          <div key={rIdx} className="flex shrink-0">
            <div
              className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide truncate"
              style={{ width: CARD_W }}
            >
              {roundMatches[0]?.tournamentRoundText ?? `Round ${rIdx + 1}`}
            </div>
            {rIdx < rounds.length - 1 && <div style={{ width: CONN_W }} />}
          </div>
        ))}
      </div>

      {/* Bracket */}
      <div
        className="flex items-stretch"
        style={{ height: totalH, minWidth: "max-content" }}
      >
        {rounds.map((roundMatches, rIdx) => {
          const slotH = totalH / roundMatches.length;
          const half = slotH / 2;
          const isLast = rIdx === rounds.length - 1;
          const pairs = Math.floor(roundMatches.length / 2);

          return (
            <div key={rIdx} className="flex shrink-0">
              {/* Match card column */}
              <div style={{ width: CARD_W }}>
                {roundMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-center px-1"
                    style={{ height: slotH }}
                  >
                    <BracketMatchCard match={match} />
                  </div>
                ))}
              </div>

              {/* Connector column */}
              {!isLast && (
                <div style={{ width: CONN_W, flexShrink: 0 }}>
                  {Array.from({ length: pairs }).map((_, i) => (
                    <div key={i} style={{ height: slotH * 2 }}>
                      {/*
                       * 4-div connector — arms align exactly with card centers:
                       *   [empty]   half
                       *   [top arm: border-top + border-right]  half  ← aligns with top card center
                       *   [bot arm: border-bottom + border-right] half ← aligns with bottom card center
                       *   [empty]   half
                       * The border-right of both arm divs forms the vertical spine.
                       * Their shared boundary (at slotH from pair top) is the exit point,
                       * which is exactly the center of the destination slot in the next round.
                       */}
                      <div style={{ height: half }} />
                      <div
                        style={{
                          height: half,
                          borderTop: "1.5px solid #d1d5db",
                          borderRight: "1.5px solid #d1d5db",
                        }}
                      />
                      <div
                        style={{
                          height: half,
                          borderBottom: "1.5px solid #d1d5db",
                          borderRight: "1.5px solid #d1d5db",
                        }}
                      />
                      <div style={{ height: half }} />
                    </div>
                  ))}
                  {/* Odd last match: straight line through to next round */}
                  {roundMatches.length % 2 === 1 && (
                    <div
                      style={{
                        height: slotH,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          borderTop: "1.5px solid #d1d5db",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3rd place */}
      {thirdPlace && (
        <div className="mt-6 pt-5 border-t border-dashed border-gray-200">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {thirdPlace.tournamentRoundText || "3rd Place"}
          </p>
          <div style={{ width: CARD_W }}>
            <BracketMatchCard match={thirdPlace} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
