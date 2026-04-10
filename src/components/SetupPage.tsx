import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayers } from '../hooks/usePlayers';
import { useTeams } from '../hooks/useTeams';
import { UserPlus, X, Users, Gamepad2, ArrowRight, Edit } from 'lucide-react';

export const SetupPage: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
  const { players, addPlayer, removePlayer } = usePlayers();
  const { teams, addTeam, removeTeam, addPlayerToTeam, removePlayerFromTeam } = useTeams(players);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName);
      setNewPlayerName('');
    }
  };

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      addTeam(newTeamName);
      setNewTeamName('');
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && team.playerIds.length === 0) {
      removeTeam(teamId);
    } else if (team && team.playerIds.length > 0 && teams.length > 1) {
      removeTeam(teamId);
    }
  };

  const allPlayersAssigned = players.length > 0 && players.every(p => teams.some(t => t.playerIds.includes(p.id)));
  const hasTeams = teams.length >= 2;
  const hasPlayers = players.length >= 2;

  const handleComplete = () => {
    if (hasTeams && hasPlayers && allPlayersAssigned) {
      onComplete();
    }
  };

  const getTeamForPlayer = (playerId: string) => teams.find(t => t.playerIds.includes(playerId));

  return (
    <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
      <header className="py-6 text-center relative">
        <h1 className="text-4xl font-black text-red-600 tracking-tighter uppercase italic">Setup</h1>
        <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Configure your party</p>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {/* Players Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="text-red-500" size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Players</h2>
            </div>
            <span className="text-xs text-slate-600">{players.length} players</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              placeholder="Enter player name..."
              className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-2xl px-4 py-3 focus:border-red-600 outline-none transition-all"
            />
            <button
              onClick={handleAddPlayer}
              className="bg-red-600 p-4 rounded-2xl active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newPlayerName.trim()}
            >
              <UserPlus size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {players.map(player => (
              <motion.div
                layout="position"
                key={player.id}
                className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                  <span className="font-bold text-lg">{player.name}</span>
                  <span className="text-xs text-slate-500">
                    {getTeamForPlayer(player.id) ? `on ${getTeamForPlayer(player.id)!.name}` : 'no team'}
                  </span>
                </div>
                <button onClick={() => removePlayer(player.id)} className="text-slate-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Teams Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="text-red-500" size={20} />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Teams</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">{teams.length} teams</span>
              <button
                onClick={() => setIsTeamManagerOpen(!isTeamManagerOpen)}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
              >
                Manage
              </button>
            </div>
          </div>

          {/* Expandable Team Manager */}
          <motion.div
            initial={false}
            animate={{ height: isTeamManagerOpen ? 'auto' : 0, opacity: isTeamManagerOpen ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/30 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                  placeholder="New team name..."
                  className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-2 focus:border-red-600 outline-none transition-all text-sm"
                />
                <button
                  onClick={handleAddTeam}
                  className="bg-red-600 px-4 rounded-xl active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newTeamName.trim()}
                >
                  <UserPlus size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {teams.map(team => (
                  <motion.div
                    layout="position"
                    key={team.id}
                    className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="font-bold text-sm">{team.name}</span>
                      <span className="text-xs text-slate-500">({team.playerIds.length} players)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const newTeamName = prompt('Edit team name:', team.name);
                          if (newTeamName && newTeamName.trim()) {
                            // Note: We'd need an updateTeam function in useTeams for this
                            // For now, we'll just remove and re-add
                          }
                        }}
                        className="text-slate-500 hover:text-red-500 p-1.5 disabled:opacity-50"
                        title="Edit team name"
                        disabled={team.playerIds.length > 0}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveTeam(team.id)}
                        className="text-slate-500 hover:text-red-500 p-1.5"
                        disabled={team.playerIds.length > 0 && teams.length <= 1}
                        title={team.playerIds.length > 0 ? "Keep at least 1 team with players" : "Remove team"}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Team assignment status */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Team Assignment</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${allPlayersAssigned ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {allPlayersAssigned ? 'All assigned' : `${players.filter(p => !getTeamForPlayer(p.id)).length} unassigned`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Players can be moved between teams at any time. At least 2 teams required.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {players.map(player => {
                const team = getTeamForPlayer(player.id);
                return (
                  <div key={player.id} className="flex items-center justify-between bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <span className="text-sm font-medium">{player.name}</span>
                    <select
                      value={team?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          addPlayerToTeam(player.id, e.target.value);
                        } else {
                          removePlayerFromTeam(player.id, team?.id || '');
                        }
                      }}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:border-red-500 outline-none"
                    >
                      <option value="">No team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Footer - Complete Button */}
      <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
        <button
          onClick={handleComplete}
          disabled={
            !hasTeams || !hasPlayers || !allPlayersAssigned
          }
          className={`w-full py-4 rounded-2xl font-black text-xl transition-all flex items-center justify-center space-x-2 ${
            hasTeams && hasPlayers && allPlayersAssigned
              ? 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Start Playing</span>
          <ArrowRight size={20} />
        </button>

        {(!hasTeams || !hasPlayers || !allPlayersAssigned) && (
          <p className="text-center text-xs text-slate-600">
            {(!hasPlayers && 'Add at least 2 players') ||
            (!hasTeams && 'Create at least 2 teams') ||
            (!allPlayersAssigned && 'Assign all players to teams')}
          </p>
        )}
      </div>
    </div>
  );
};
