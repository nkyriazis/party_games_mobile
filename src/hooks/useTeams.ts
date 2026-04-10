import { useState, useEffect, useCallback } from 'react';
import { Player } from './usePlayers';

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
  playerIds: string[];
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

export const useTeams = (players: Player[]) => {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('tick-tack-boom-teams');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('tick-tack-boom-teams', JSON.stringify(teams));
  }, [teams]);

  const addTeam = useCallback((name: string) => {
    if (!name.trim()) return;
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);

    setTeams(prev => [
      ...prev,
      {
        id,
        name: name.trim(),
        color: COLORS[prev.length % COLORS.length],
        score: 0,
        playerIds: [],
      },
    ]);
  }, []);

  const removeTeam = useCallback((id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    // Adjust indices if needed
    if (currentTeamIndex >= teams.length - 1) {
      setCurrentTeamIndex(Math.max(0, teams.length - 2));
    }
  }, [teams.length, currentTeamIndex]);

  const addPlayerToTeam = useCallback((playerId: string, teamId: string) => {
    setTeams(prev => prev.map(team => {
      if (team.id === teamId && !team.playerIds.includes(playerId)) {
        return { ...team, playerIds: [...team.playerIds, playerId] };
      }
      return team;
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
    const playerId = team.playerIds[currentPlayerIndex % team.playerIds.length];
    const player = players.find(p => p.id === playerId);
    return { player, team };
  }, [teams, currentTeamIndex, currentPlayerIndex, players]);

  const advanceTurn = useCallback(() => {
    // Move to next player in current team
    const team = teams[currentTeamIndex];
    if (team && team.playerIds.length > 0) {
      setCurrentPlayerIndex(prev => (prev + 1) % team.playerIds.length);
    } else {
      // Move to next team if current team has no players
      setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    }
  }, [teams, currentTeamIndex]);

  const resetScores = useCallback(() => {
    setTeams(prev => prev.map(team => ({ ...team, score: 0 })));
    setCurrentTeamIndex(0);
    setCurrentPlayerIndex(0);
  }, []);

  // Get next up player info
  const getNextUpPlayer = useCallback(() => {
    // Calculate next turn
    let nextTeamIndex = currentTeamIndex;
    let nextPlayerIndex = currentPlayerIndex + 1;

    const team = teams[currentTeamIndex];
    if (team && team.playerIds.length > 0) {
      if (nextPlayerIndex >= team.playerIds.length) {
        nextTeamIndex = (currentTeamIndex + 1) % teams.length;
        nextPlayerIndex = 0;
      }
    } else {
      nextTeamIndex = (currentTeamIndex + 1) % teams.length;
      nextPlayerIndex = 0;
    }

    const nextTeam = teams[nextTeamIndex];
    if (nextTeam && nextTeam.playerIds.length > 0) {
      const playerId = nextTeam.playerIds[nextPlayerIndex];
      const player = players.find(p => p.id === playerId);
      return { player, team: nextTeam };
    }
    return { player: undefined, team: undefined };
  }, [teams, currentTeamIndex, currentPlayerIndex, players]);

  return {
    teams,
    addTeam,
    removeTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    updateTeamScore,
    getTeamForPlayer,
    getDescribingPlayer,
    getNextUpPlayer,
    advanceTurn,
    resetScores,
    currentTeamIndex,
    currentPlayerIndex,
  };
};
