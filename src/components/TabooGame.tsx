import React, { useState, useEffect } from 'react';
import { useTaboo } from '../hooks/useTaboo';
import { TabooCardComponent } from '../components/TabooCard';
import { motion } from 'framer-motion';
import { Player } from '../contexts/PlayersContext';
import { Team } from '../hooks/useTeams';

const TABOO_DEFAULT_ROUNDS = 6;
const TABOO_ROUND_PRESETS = [4, 6, 8];

export const TabooGame: React.FC<{
  players: Player[],
  teams: Team[],
  updateTeamScore: (teamId: string, delta: number) => void,
  onBack: () => void,
  setCurrentGame: (game: 'setup' | 'hub' | 'tick-tack-boom' | 'taboo') => void
}> = ({ players, teams, updateTeamScore, onBack, setCurrentGame }) => {
  const [roundState, setRoundState] = useState<'select' | 'ready' | 'game'>('select');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(() => (
    teams.filter((team) => team.playerIds.length > 0).slice(0, 2).map((team) => team.id)
  ));
  const [currentDescribingTeamId, setCurrentDescribingTeamId] = useState<string | null>(null);
  const [teamPlayerIndices, setTeamPlayerIndices] = useState<Record<string, number>>({});
  const [totalRounds, setTotalRounds] = useState(TABOO_DEFAULT_ROUNDS);
  const [currentRound, setCurrentRound] = useState(1);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const populatedTeams = teams.filter((team) => team.playerIds.length > 0);
  const selectedTeams = selectedTeamIds
    .map((teamId) => populatedTeams.find((team) => team.id === teamId))
    .filter((team): team is Team => Boolean(team));
  const describingTeam = selectedTeams.find((team) => team.id === currentDescribingTeamId) ?? selectedTeams[0];
  const supervisingTeam = selectedTeams.find((team) => team.id !== describingTeam?.id);
  const describingPlayerIndex = describingTeam ? (teamPlayerIndices[describingTeam.id] ?? 0) : 0;
  const describingPlayerId = describingTeam?.playerIds[describingPlayerIndex % (describingTeam?.playerIds.length || 1)];
  const roundInfo = {
    describingTeam,
    describingPlayer: players.find((player) => player.id === describingPlayerId),
    supervisingTeam,
  };
  const activeTeamId = roundInfo.describingTeam?.id || '';
  const sortedMatchTeams = [...selectedTeams].sort(
    (left, right) => (matchScores[right.id] ?? 0) - (matchScores[left.id] ?? 0)
  );

  const handleScoreChange = (teamId: string, delta: number) => {
    setMatchScores((prev) => ({
      ...prev,
      [teamId]: (prev[teamId] ?? 0) + delta,
    }));
    updateTeamScore(teamId, delta);
  };

  const {
    currentCard,
    timeLeft,
    isPlaying,
    isGameOver,
    startRound,
    handleCorrect,
    handleTaboo,
    handlePass,
    resetRound,
  } = useTaboo(activeTeamId, handleScoreChange);

  useEffect(() => {
    if (roundState === 'game' && !isPlaying && !isGameOver) {
      startRound();
    }
  }, [roundState, isPlaying, isGameOver, startRound]);

  useEffect(() => {
    setSelectedTeamIds((prev) => {
      const validTeamIds = new Set(populatedTeams.map((team) => team.id));
      const next = prev.filter((teamId) => validTeamIds.has(teamId));
      return next.length === prev.length ? prev : next;
    });
  }, [populatedTeams]);

  useEffect(() => {
    setTeamPlayerIndices((prev) => {
      const next: Record<string, number> = {};
      let changed = false;

      for (const team of selectedTeams) {
        const maxIndex = Math.max(team.playerIds.length - 1, 0);
        const normalizedIndex = Math.min(prev[team.id] ?? 0, maxIndex);
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
  }, [selectedTeams]);

  useEffect(() => {
    if (selectedTeams.length === 0) {
      if (currentDescribingTeamId !== null) {
        setCurrentDescribingTeamId(null);
      }
      return;
    }

    if (!currentDescribingTeamId || !selectedTeams.some((team) => team.id === currentDescribingTeamId)) {
      setCurrentDescribingTeamId(selectedTeams[0].id);
    }
  }, [selectedTeams, currentDescribingTeamId]);

  const handleToggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds((prev) => {
      if (prev.includes(teamId)) {
        return prev.filter((id) => id !== teamId);
      }

      if (prev.length >= 2) {
        return prev;
      }

      return [...prev, teamId];
    });
  };

  const handleConfirmTeams = () => {
    if (selectedTeams.length !== 2) {
      return;
    }

    const initialIndices = selectedTeams.reduce<Record<string, number>>((indices, team) => {
      indices[team.id] = 0;
      return indices;
    }, {});

    setTeamPlayerIndices(initialIndices);
    setCurrentDescribingTeamId(selectedTeams[0].id);
    setCurrentRound(1);
    setIsMatchComplete(false);
    setMatchScores(selectedTeams.reduce<Record<string, number>>((scores, team) => {
      scores[team.id] = 0;
      return scores;
    }, {}));
    resetRound();
    setRoundState('ready');
  };

  const handleChangeTeams = () => {
    resetRound();
    setCurrentRound(1);
    setIsMatchComplete(false);
    setRoundState('select');
  };

  const handleNextRound = () => {
    if (roundInfo.describingTeam && roundInfo.describingTeam.playerIds.length > 0) {
      setTeamPlayerIndices((prev) => ({
        ...prev,
        [roundInfo.describingTeam!.id]: ((prev[roundInfo.describingTeam!.id] ?? 0) + 1) % roundInfo.describingTeam!.playerIds.length,
      }));
    }

    if (roundInfo.supervisingTeam) {
      setCurrentDescribingTeamId(roundInfo.supervisingTeam.id);
    }

    if (currentRound >= totalRounds) {
      resetRound();
      setIsMatchComplete(true);
      return;
    }

    resetRound();
    setCurrentRound((prev) => prev + 1);
    setRoundState('ready');
  };

  if (populatedTeams.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <h1 className="text-4xl font-black mb-8 text-red-500">TABOO</h1>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 max-w-md text-center mb-8">
          <h2 className="text-2xl font-black text-amber-500 mb-4">Two Teams Required</h2>
          <p className="text-slate-300 mb-4">
            Taboo needs one describing team and one supervising team.
          </p>
          <p className="text-sm text-slate-500">
            Add at least two teams with at least one player each.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-8 py-4 bg-white text-slate-950 font-black rounded-2xl text-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          Back to Hub
        </button>
        <button
          onClick={() => setCurrentGame('setup')}
          className="mt-4 text-slate-500 hover:text-white transition-colors text-sm"
        >
          Go to Setup →
        </button>
      </div>
    );
  }

  if (roundState === 'select') {
    return (
      <div className="flex flex-col min-h-screen p-6 bg-slate-950 text-white max-w-md mx-auto w-full">
        <header className="py-6 text-center">
          <h1 className="text-4xl font-black mb-2 text-red-500">TABOO</h1>
          <p className="text-sm text-slate-400">Pick the two teams for this matchup.</p>
        </header>

        <div className="mb-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Rounds</div>
              <div className="text-3xl font-black text-white mt-2">{totalRounds}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTotalRounds((prev) => Math.max(1, prev - 1))}
                className="h-11 w-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xl font-black transition-colors"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setTotalRounds((prev) => Math.min(20, prev + 1))}
                className="h-11 w-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xl font-black transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TABOO_ROUND_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTotalRounds(preset)}
                className={`rounded-2xl border px-3 py-2 text-sm font-bold transition-colors ${totalRounds === preset
                  ? 'border-red-500 bg-red-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
              >
                {preset} rounds
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {populatedTeams.map((team) => {
            const isSelected = selectedTeamIds.includes(team.id);
            const playerNames = team.playerIds
              .map((playerId) => players.find((player) => player.id === playerId)?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => handleToggleTeamSelection(team.id)}
                className={`w-full rounded-3xl border p-5 text-left transition-all ${isSelected
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Team</div>
                    <div className="text-2xl font-black" style={{ color: team.color }}>
                      {team.name}
                    </div>
                    <div className="text-sm text-slate-500 mt-2">
                      {playerNames.join(', ')}
                    </div>
                  </div>
                  <div className={`mt-1 h-6 w-6 rounded-full border-2 ${isSelected ? 'border-red-500 bg-red-500' : 'border-slate-600'}`} />
                </div>
              </button>
            );
          })}
        </div>

        <footer className="py-6 space-y-3">
          <p className="text-center text-sm text-slate-500">
            {selectedTeamIds.length === 2 ? 'Two teams selected.' : `Pick ${2 - selectedTeamIds.length} more team(s).`}
          </p>
          <button
            onClick={handleConfirmTeams}
            disabled={selectedTeams.length !== 2}
            className="w-full bg-red-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-red-700 text-white font-black py-4 rounded-3xl text-xl transition-all active:scale-95 disabled:active:scale-100"
          >
            CONTINUE
          </button>
          <button
            onClick={onBack}
            className="w-full text-slate-500 hover:text-white transition-colors text-sm"
          >
            ← Back to Hub
          </button>
        </footer>
      </div>
    );
  }

  if (roundState === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white">
        <h1 className="text-4xl font-black mb-8 text-red-500">TABOO</h1>
        <div className="text-sm text-slate-500 mb-6">Round {currentRound} of {totalRounds}</div>
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 w-full max-w-md mb-8 space-y-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Describing Team</div>
            <div className="text-2xl font-black" style={{ color: roundInfo.describingTeam?.color }}>
              {roundInfo.describingTeam?.name}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Describing Player</div>
            <div className="text-3xl font-black text-white mt-3">
              {roundInfo.describingPlayer?.name}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Supervising Team</div>
            <div className="text-2xl font-black" style={{ color: roundInfo.supervisingTeam?.color }}>
              {roundInfo.supervisingTeam?.name}
            </div>
          </div>
        </div>

        <div className="space-y-3 w-full max-w-md">
          <button
            onClick={() => setRoundState('game')}
            className="w-full px-12 py-4 bg-red-600 hover:bg-red-700 text-white text-2xl font-black rounded-full shadow-xl transition-all active:scale-95"
          >
            START ROUND
          </button>

          <button
            onClick={handleChangeTeams}
            className="w-full text-slate-500 hover:text-white transition-colors text-sm"
          >
            Change Teams
          </button>

          <button
            onClick={onBack}
            className="w-full text-slate-500 hover:text-white transition-colors"
          >
            ← Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (isMatchComplete) {
    return (
      <div className="flex flex-col min-h-screen p-6 bg-slate-950 text-white max-w-md mx-auto w-full">
        <header className="py-8 text-center">
          <h1 className="text-4xl font-black text-red-500">TABOO</h1>
          <p className="text-slate-400 mt-3">Match complete after {totalRounds} rounds.</p>
        </header>

        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="text-xs uppercase tracking-widest text-slate-500">Final Team Scores</div>
          {sortedMatchTeams.map((team, index) => (
            <div key={team.id} className="flex items-center justify-between rounded-2xl bg-slate-950/60 border border-slate-800 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-600 font-black w-5">{index + 1}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                <span className="font-bold truncate">{team.name}</span>
              </div>
              <span className="font-black" style={{ color: team.color }}>
                {matchScores[team.id] ?? 0} pts
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleConfirmTeams}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-3xl text-xl transition-all active:scale-95"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={handleChangeTeams}
            className="w-full text-slate-500 hover:text-white transition-colors text-sm"
          >
            New Match Setup
          </button>
          <button
            onClick={onBack}
            className="w-full text-slate-500 hover:text-white transition-colors text-sm"
          >
            ← Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (roundState === 'game') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <div className="absolute top-4 left-4 right-4 flex justify-center">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur px-5 py-4 rounded-3xl border border-slate-700 shadow-lg shadow-slate-950/30 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs uppercase tracking-widest text-slate-500">Describing Team</span>
              <span className="text-xl font-black" style={{ color: roundInfo.describingTeam?.color }}>
                {roundInfo.describingTeam?.name}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-slate-800 pt-3">
              <span className="text-xs uppercase tracking-widest text-slate-500">Describing Player</span>
              <span className="text-xl font-black text-white">
                {roundInfo.describingPlayer?.name}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-slate-800 pt-3">
              <span className="text-xs uppercase tracking-widest text-slate-500">Supervising Team</span>
              <span className="text-xl font-black" style={{ color: roundInfo.supervisingTeam?.color }}>
                {roundInfo.supervisingTeam?.name}
              </span>
            </div>
          </div>
        </div>

        {!isPlaying && !isGameOver && (
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-3">Ready, {roundInfo.describingPlayer?.name}?</h2>
            <p className="text-slate-500">Round {currentRound} of {totalRounds}. {roundInfo.supervisingTeam?.name} supervises this round.</p>
          </div>
        )}

        {isPlaying && currentCard && (
          <TabooCardComponent
            card={currentCard}
            timeLeft={timeLeft}
            onCorrect={handleCorrect}
            onTaboo={handleTaboo}
            onPass={handlePass}
          />
        )}

        {isGameOver && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mt-16"
          >
            <h2 className="text-5xl font-black text-red-500 mb-4">TIME'S UP!</h2>
            <p className="text-xl text-slate-400 mb-8">Round ended for {roundInfo.describingPlayer?.name}</p>
            <button
              onClick={handleNextRound}
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
            >
              Next Round
            </button>
          </motion.div>
        )}

        <button
          onClick={onBack}
          className="fixed bottom-8 left-8 text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Exit Game
        </button>
      </div>
    );
  }

  return null;
};
