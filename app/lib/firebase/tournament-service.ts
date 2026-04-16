import { db } from "./firebase";
import { ref, get, onValue, off } from "firebase/database";

export type Participant = {
  canEditTeams: boolean;
  isWinner: boolean;
  name: string;
  teams_id: number;
  resultText?: string;
};

export type Match = {
  id: string;
  name: string;
  nextMatchId: string;
  participants: (Participant | null)[];
  startTime: string;
  state: string;
  tournamentRoundText: string;
  [key: string]: any;
};

/**
 * Get sports list from Firebase (one-time fetch)
 * Path: [slug]/sports
 */
export const getSportsByTournament = async (
  slug: string
): Promise<{ id: string; name: string }[]> => {
  try {
    const sportsRef = ref(db, `${slug}/sports`);
    const snapshot = await get(sportsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const sportsData = snapshot.val();
    // Convert object keys to array format
    return Object.keys(sportsData).map((key) => ({
      id: key,
      name: key,
    }));
  } catch (error) {
    console.error(`Error fetching sports for tournament ${slug}:`, error);
    return [];
  }
};

/**
 * Subscribe to real-time sports updates from Firebase
 * Path: [slug]/sports
 * Returns an unsubscribe function to clean up the listener
 */
export const subscribeSportsByTournament = (
  slug: string,
  callback: (sports: { id: string; name: string }[]) => void
): (() => void) => {
  try {
    const sportsRef = ref(db, `${slug}/sports`);

    const listener = onValue(sportsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const sportsData = snapshot.val();
      const sports = Object.keys(sportsData).map((key) => ({
        id: key,
        name: key,
      }));
      callback(sports);
    });

    // Return unsubscribe function
    return () => off(sportsRef, "value", listener);
  } catch (error) {
    console.error(`Error subscribing to sports for tournament ${slug}:`, error);
    return () => {};
  }
};

/**
 * Get matches for a specific sport (one-time fetch)
 * Path: [slug]/sports/[sportname]/matches
 * Filters out empty participants (null values)
 */
export const getMatchesBySport = async (
  slug: string,
  sportName: string
): Promise<Match[]> => {
  try {
    const matchesRef = ref(db, `${slug}/sports/${sportName}/matches`);
    const snapshot = await get(matchesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const matchesData = snapshot.val();
    // Convert object to array, preserving the match data structure
    return Object.keys(matchesData).map((key) => ({
      id: key,
      ...matchesData[key],
      // Filter out null participants
      participants: matchesData[key].participants?.filter(
        (p: Participant | null): p is Participant => p !== null
      ) || [],
    }));
  } catch (error) {
    console.error(
      `Error fetching matches for sport ${sportName} in tournament ${slug}:`,
      error
    );
    return [];
  }
};

/**
 * Subscribe to real-time match updates for a specific sport
 * Path: [slug]/sports/[sportname]/matches
 * Returns an unsubscribe function to clean up the listener
 */
export const subscribeMatchesBySport = (
  slug: string,
  sportName: string,
  callback: (matches: Match[]) => void
): (() => void) => {
  try {
    const matchesRef = ref(db, `${slug}/sports/${sportName}/matches`);

    const listener = onValue(matchesRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const matchesData = snapshot.val();
      const matches = Object.keys(matchesData).map((key) => ({
        id: key,
        ...matchesData[key],
        // Filter out null participants
        participants: matchesData[key].participants?.filter(
          (p: Participant | null): p is Participant => p !== null
        ) || [],
      }));
      callback(matches);
    });

    // Return unsubscribe function
    return () => off(matchesRef, "value", listener);
  } catch (error) {
    console.error(
      `Error subscribing to matches for sport ${sportName} in tournament ${slug}:`,
      error
    );
    return () => {};
  }
};

/**
 * Separate live matches from other matches
 */
export const separateLiveMatches = (
  matches: Match[]
): { liveMatches: Match[]; otherMatches: Match[] } => {
  return {
    liveMatches: matches.filter((m) => m.state === "LIVE"),
    otherMatches: matches.filter((m) => m.state !== "LIVE"),
  };
};

/**
 * Categorize matches by tournamentRoundText
 */
export const categorizeMatchesByRound = (
  matches: Match[]
): Record<string, Match[]> => {
  return matches.reduce(
    (acc, match) => {
      const roundText = match.tournamentRoundText || "Uncategorized";
      if (!acc[roundText]) {
        acc[roundText] = [];
      }
      acc[roundText].push(match);
      return acc;
    },
    {} as Record<string, Match[]>
  );
};
