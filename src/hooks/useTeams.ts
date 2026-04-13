import { useState, useEffect, useCallback } from 'react';
import { Player } from '../contexts/PlayersContext';

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  playerIds: string[];
}

interface RoundInfo {
  describingTeam: Team | undefined;
  describingPlayer: Player | undefined;
  supervisingTeam: Team | undefined;
}

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#06b6d4', // cyan
];

const createTeamId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const normalizeTeams = (teams: Team[], validPlayerIds?: Set<string>) => {
  const assignedPlayerIds = new Set<string>();

  return teams.map((team) => {
    const seenInTeam = new Set<string>();
    const playerIds = team.playerIds.filter((playerId) => {
      if (validPlayerIds && !validPlayerIds.has(playerId)) {
        return false;
      }

      if (seenInTeam.has(playerId) || assignedPlayerIds.has(playerId)) {
        return false;
      }

      seenInTeam.add(playerId);
      assignedPlayerIds.add(playerId);
      return true;
    });

    return playerIds.length === team.playerIds.length ? team : { ...team, playerIds };
  });
};

export const useTeams = (players: Player[]) => {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('tick-tack-boom-teams');
    return saved ? normalizeTeams(JSON.parse(saved) as Team[]) : [];
  });
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [teamPlayerIndices, setTeamPlayerIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    const validPlayerIds = new Set(players.map((player) => player.id));

    setTeams((prev) => {
      const nextTeams = normalizeTeams(prev, validPlayerIds);
      const changed = nextTeams.some((team, index) => team !== prev[index]);

      return changed ? nextTeams : prev;
    });
  }, [players]);

  useEffect(() => {
    setTeamPlayerIndices((prev) => {
      let changed = false;
      const next: Record<string, number> = {};

      for (const team of teams) {
        const maxIndex = Math.max(team.playerIds.length - 1, 0);
        const previousIndex = prev[team.id] ?? 0;
        const normalizedIndex = Math.min(previousIndex, maxIndex);
        next[team.id] = normalizedIndex;

        if (!(team.id in prev) || prev[team.id] !== normalizedIndex) {
          changed = true;
        }
      }

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [teams]);

  useEffect(() => {
    if (teams.length === 0) {
      if (currentTeamIndex !== 0) {
        setCurrentTeamIndex(0);
      }
      return;
    }

    const currentTeam = teams[currentTeamIndex];
    if (!currentTeam || currentTeam.playerIds.length === 0) {
      const firstPopulatedTeamIndex = teams.findIndex((team) => team.playerIds.length > 0);
      if (firstPopulatedTeamIndex !== -1 && firstPopulatedTeamIndex !== currentTeamIndex) {
        setCurrentTeamIndex(firstPopulatedTeamIndex);
      }
    }
  }, [teams, currentTeamIndex]);

  useEffect(() => {
    localStorage.setItem('tick-tack-boom-teams', JSON.stringify(teams));
  }, [teams]);

  const findNextPopulatedTeamIndex = useCallback((startIndex: number) => {
    if (teams.length === 0) {
      return -1;
    }

    for (let step = 1; step <= teams.length; step += 1) {
      const candidateIndex = (startIndex + step) % teams.length;
      if (teams[candidateIndex]?.playerIds.length) {
        return candidateIndex;
      }
    }

    return -1;
  }, [teams]);

  const addTeam = useCallback((name: string, playerIds: string[] = []) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const validPlayerIds = new Set(players.map((player) => player.id));
    const uniquePlayerIds = Array.from(new Set(playerIds)).filter((playerId) => validPlayerIds.has(playerId));
    const selectedPlayers = new Set(uniquePlayerIds);
    const id = createTeamId();

    setTeams((prev) => [
      ...prev.map((team) => (
        selectedPlayers.size > 0
          ? { ...team, playerIds: team.playerIds.filter((playerId) => !selectedPlayers.has(playerId)) }
          : team
      )),
      {
        id,
        name: trimmedName,
        color: COLORS[prev.length % COLORS.length],
        score: 0,
        playerIds: uniquePlayerIds,
      },
    ]);
  }, [players]);

  const removeTeam = useCallback((id: string) => {
    setTeams((prev) => {
      const nextTeams = prev.filter((team) => team.id !== id);
      setCurrentTeamIndex((currentIndex) => {
        if (nextTeams.length === 0) {
          return 0;
        }

        return Math.min(currentIndex, nextTeams.length - 1);
      });

      return nextTeams;
    });
  }, []);

  const updateTeam = useCallback((teamId: string, name: string, playerIds: string[]) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const validPlayerIds = new Set(players.map((player) => player.id));
    const uniquePlayerIds = Array.from(new Set(playerIds)).filter((playerId) => validPlayerIds.has(playerId));
    const selectedPlayers = new Set(uniquePlayerIds);

    setTeams((prev) => prev.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          name: trimmedName,
          playerIds: uniquePlayerIds,
        };
      }

      if (selectedPlayers.size === 0) {
        return team;
      }

      const nextPlayerIds = team.playerIds.filter((playerId) => !selectedPlayers.has(playerId));
      return nextPlayerIds.length === team.playerIds.length ? team : { ...team, playerIds: nextPlayerIds };
    }));
  }, [players]);

  const addPlayerToTeam = useCallback((playerId: string, teamId: string) => {
    setTeams((prev) => prev.map((team) => {
      const withoutPlayer = team.playerIds.filter((id) => id !== playerId);

      if (team.id === teamId) {
        return team.playerIds.includes(playerId)
          ? team
          : { ...team, playerIds: [...withoutPlayer, playerId] };
      }

      return withoutPlayer.length === team.playerIds.length ? team : { ...team, playerIds: withoutPlayer };
    }));
  }, []);

  const removePlayerFromTeam = useCallback((playerId: string, teamId: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId) {
        return { ...team, playerIds: team.playerIds.filter(id => id !== playerId) };
      }
      return team;
    }));
  }, []);

  const updateTeamScore = useCallback((teamId: string, delta: number) => {
    setTeams(prev => prev.map(team =>
      team.id === teamId ? { ...team, score: team.score + delta } : team
    ));
  }, []);

  const getTeamForPlayer = useCallback((playerId: string) => {
    return teams.find(team => team.playerIds.includes(playerId));
  }, [teams]);

  // Get current describing player info
  const getDescribingPlayer = useCallback(() => {
    const team = teams[currentTeamIndex];
    if (!team || team.playerIds.length === 0) {
      return { player: undefined, team: undefined };
    }
    const playerIndex = teamPlayerIndices[team.id] ?? 0;
    const playerId = team.playerIds[playerIndex % team.playerIds.length];
    const player = players.find(p => p.id === playerId);
    return { player, team };
  }, [teams, currentTeamIndex, teamPlayerIndices, players]);

  const getCurrentRoundInfo = useCallback((): RoundInfo => {
    const { player, team } = getDescribingPlayer();
    const supervisingTeamIndex = findNextPopulatedTeamIndex(currentTeamIndex);
    const supervisingTeam = supervisingTeamIndex === -1 ? undefined : teams[supervisingTeamIndex];

    return {
      describingTeam: team,
      describingPlayer: player,
      supervisingTeam,
    };
  }, [getDescribingPlayer, findNextPopulatedTeamIndex, currentTeamIndex, teams]);

  const advanceTurn = useCallback(() => {
    const team = teams[currentTeamIndex];
    const nextTeamIndex = findNextPopulatedTeamIndex(currentTeamIndex);

    if (team && team.playerIds.length > 0) {
      setTeamPlayerIndices((prev) => ({
        ...prev,
        [team.id]: ((prev[team.id] ?? 0) + 1) % team.playerIds.length,
      }));
    }

    if (nextTeamIndex !== -1) {
      setCurrentTeamIndex(nextTeamIndex);
    }
  }, [teams, currentTeamIndex, findNextPopulatedTeamIndex]);

  const resetScores = useCallback(() => {
    setTeams(prev => prev.map(team => ({ ...team, score: 0 })));
    setCurrentTeamIndex(0);
    setTeamPlayerIndices({});
  }, []);

  // Get next up player info
  const getNextUpPlayer = useCallback(() => {
    const nextTeamIndex = findNextPopulatedTeamIndex(currentTeamIndex);

    const nextTeam = nextTeamIndex === -1 ? undefined : teams[nextTeamIndex];
    if (nextTeam && nextTeam.playerIds.length > 0) {
      const playerIndex = teamPlayerIndices[nextTeam.id] ?? 0;
      const playerId = nextTeam.playerIds[playerIndex % nextTeam.playerIds.length];
      const player = players.find(p => p.id === playerId);
      return { player, team: nextTeam };
    }
    return { player: undefined, team: undefined };
  }, [teams, currentTeamIndex, teamPlayerIndices, players, findNextPopulatedTeamIndex]);

  return {
    teams,
    addTeam,
    removeTeam,
    updateTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    updateTeamScore,
    getTeamForPlayer,
    getDescribingPlayer,
    getCurrentRoundInfo,
    getNextUpPlayer,
    advanceTurn,
    resetScores,
    currentTeamIndex,
    currentPlayerIndex: teamPlayerIndices[teams[currentTeamIndex]?.id ?? ''] ?? 0,
  };
};
