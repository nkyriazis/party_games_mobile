import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePlayers } from '../contexts/PlayersContext';
import { Team } from '../hooks/useTeams';
import { X, Users, Gamepad2, ArrowRight, Edit, Camera } from 'lucide-react';

export const SetupPage: React.FC<{
  teams: Team[];
  addTeam: (name: string, playerIds: string[]) => void;
  updateTeam: (id: string, name: string, playerIds: string[]) => void;
  removeTeam: (id: string) => void;
  getTeamForPlayer: (playerId: string) => Team | undefined;
  onComplete: () => void;
}> = ({
  teams,
  addTeam,
  updateTeam,
  removeTeam,
  getTeamForPlayer,
  onComplete,
}) => {
    const { players, addPlayer, updatePlayer, removePlayer } = usePlayers();
    const [playerDraftName, setPlayerDraftName] = useState('');
    const [playerDraftAvatar, setPlayerDraftAvatar] = useState<string | null>(null);
    const [playerNameError, setPlayerNameError] = useState<string | null>(null);
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [teamDraftName, setTeamDraftName] = useState('');
    const [teamDraftPlayerIds, setTeamDraftPlayerIds] = useState<string[]>([]);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const editingPlayer = players.find((player) => player.id === editingPlayerId);
    const editingTeam = teams.find((team) => team.id === editingTeamId);
    const hasPlayers = players.length >= 2;
    const unassignedPlayers = players.filter((player) => !getTeamForPlayer(player.id));

    const resetPlayerForm = useCallback(() => {
      setEditingPlayerId(null);
      setPlayerDraftName('');
      setPlayerDraftAvatar(null);
      setPlayerNameError(null);
    }, []);

    const resetTeamForm = useCallback(() => {
      setEditingTeamId(null);
      setTeamDraftName('');
      setTeamDraftPlayerIds([]);
    }, []);

    useEffect(() => {
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }, []);

    useEffect(() => {
      const validPlayerIds = new Set(players.map((player) => player.id));

      setTeamDraftPlayerIds((prev) => prev.filter((playerId) => validPlayerIds.has(playerId)));

      if (editingPlayerId && !players.some((player) => player.id === editingPlayerId)) {
        resetPlayerForm();
      }

      if (editingTeamId && !teams.some((team) => team.id === editingTeamId)) {
        resetTeamForm();
      }
    }, [players, teams, editingPlayerId, editingTeamId, resetPlayerForm, resetTeamForm]);

    const closeCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsCameraOpen(false);
      setCameraError(null);
    }, []);

    const toggleCamera = async () => {
      if (isCameraOpen) {
        closeCamera();
        return;
      }

      setCameraError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOpen(true);
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Could not access camera. Please check permissions.');
      }
    };

    const toggleCameraFacing = async () => {
      if (!streamRef.current) {
        return;
      }

      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
      setCameraFacing(newFacing);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera switch error:', err);
        setCameraError('Could not switch camera.');
      }
    };

    const capturePhoto = useCallback(() => {
      const video = videoRef.current;
      if (!video || !streamRef.current) {
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return;
      }

      if (cameraFacing === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0);
      setPlayerDraftAvatar(canvas.toDataURL('image/jpeg', 0.8));
    }, [cameraFacing]);

    const handleSavePlayer = () => {
      const trimmedName = playerDraftName.trim();
      if (!trimmedName) {
        return;
      }

      const isDuplicate = players.some(
        (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== editingPlayerId,
      );
      if (isDuplicate) {
        setPlayerNameError('A player with this name already exists');
        return;
      }

      if (editingPlayerId) {
        // pass null explicitly to clear avatar, undefined would keep existing
        updatePlayer(editingPlayerId, trimmedName, playerDraftAvatar);
      } else {
        addPlayer(trimmedName, playerDraftAvatar ?? undefined);
      }

      resetPlayerForm();
      closeCamera();
    };

    const handleEditPlayer = (playerId: string) => {
      const player = players.find((entry) => entry.id === playerId);
      if (!player) {
        return;
      }

      closeCamera();
      setPlayerNameError(null);
      setEditingPlayerId(player.id);
      setPlayerDraftName(player.name);
      setPlayerDraftAvatar(player.avatar || null);
    };

    const handleRemovePlayer = (playerId: string) => {
      if (editingPlayerId === playerId) {
        resetPlayerForm();
        closeCamera();
      }

      removePlayer(playerId);
    };

    const toggleTeamPlayerSelection = (playerId: string) => {
      setTeamDraftPlayerIds((prev) => (
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId]
      ));
    };

    const handleSaveTeam = () => {
      if (!teamDraftName.trim()) {
        return;
      }

      if (editingTeamId) {
        updateTeam(editingTeamId, teamDraftName, teamDraftPlayerIds);
      } else {
        addTeam(teamDraftName, teamDraftPlayerIds);
      }

      resetTeamForm();
    };

    const handleEditTeam = (teamId: string) => {
      const team = teams.find((entry) => entry.id === teamId);
      if (!team) {
        return;
      }

      setEditingTeamId(team.id);
      setTeamDraftName(team.name);
      setTeamDraftPlayerIds(team.playerIds);
    };

    const handleRemoveTeam = (teamId: string) => {
      if (editingTeamId === teamId) {
        resetTeamForm();
      }

      removeTeam(teamId);
    };

    const handleComplete = () => {
      if (hasPlayers) {
        onComplete();
      }
    };

    return (
      <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
        <header className="py-3 text-center relative">
          <h1 className="text-4xl font-black text-red-600 tracking-tighter uppercase italic">Setup</h1>
          <p className="text-slate-500 font-bold text-xs mt-2 uppercase tracking-widest">Configure your party</p>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="text-red-500" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Players</h2>
              </div>
              <span className="text-xs text-slate-600">{players.length} players</span>
            </div>

            <div className="bg-slate-900/30 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">
                    {editingPlayer ? 'Edit Player' : 'Add Player'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Add players here, then edit or remove them from the list below.
                  </p>
                </div>
                {editingPlayer && (
                  <button
                    onClick={() => {
                      resetPlayerForm();
                      closeCamera();
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={playerDraftName}
                  onChange={(e) => {
                    setPlayerDraftName(e.target.value);
                    if (playerNameError) setPlayerNameError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePlayer()}
                  placeholder="Player name..."
                  className={`flex-1 bg-slate-950 border-2 rounded-2xl px-4 py-3 focus:border-red-600 outline-none transition-all ${playerNameError ? 'border-red-500' : 'border-slate-800'}`}
                />
                <button
                  onClick={handleSavePlayer}
                  className="bg-red-600 px-4 rounded-2xl active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm min-w-20"
                  disabled={!playerDraftName.trim() || !!playerNameError}
                  title={editingPlayer ? 'Save player' : 'Add player'}
                >
                  {editingPlayer ? 'Save' : 'Add'}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-4 rounded-2xl active:scale-90 transition-transform border-2 ${isCameraOpen
                    ? 'bg-red-600 border-red-700 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  title="Open camera to capture avatar"
                >
                  <Camera size={20} />
                </button>
              </div>

              {playerNameError && (
                <p className="text-xs text-red-400 -mt-2">{playerNameError}</p>
              )}

              {playerDraftAvatar && (
                <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-4 flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500/50">
                    <img
                      src={playerDraftAvatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Avatar Ready</p>
                    <p className="text-xs text-slate-500">This avatar will be saved with the player.</p>
                  </div>
                  <button
                    onClick={() => setPlayerDraftAvatar(null)}
                    className="text-slate-500 hover:text-red-500 p-2 transition-colors"
                    title="Remove avatar"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            <motion.div
              initial={false}
              animate={{ height: isCameraOpen ? 'auto' : 0, opacity: isCameraOpen ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-4 mb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="text-red-500" size={18} />
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Camera</h2>
                  </div>
                  <button
                    onClick={toggleCamera}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded transition-colors"
                  >
                    Close
                  </button>
                </div>

                {cameraError ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-sm text-center">{cameraError}</p>
                    <button
                      onClick={toggleCamera}
                      className="mt-3 w-full bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!playerDraftAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-slate-600 text-xs uppercase tracking-widest text-center px-4">
                            Position your face<br />for the avatar
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={toggleCameraFacing}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        disabled={!streamRef.current}
                      >
                        <Camera size={18} className="rotate-180" />
                        <span className="text-sm font-bold uppercase">
                          {cameraFacing === 'user' ? 'Rear Camera' : 'Front Camera'}
                        </span>
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        disabled={!streamRef.current}
                      >
                        <Camera size={18} />
                        <span className="text-sm font-bold uppercase">Capture</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Player List</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-700/30 text-slate-400">
                  Edit or delete
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {players.map((player) => {
                  const assignedTeam = getTeamForPlayer(player.id);

                  return (
                    <motion.div
                      layout="position"
                      key={player.id}
                      className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {player.avatar ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 flex-shrink-0">
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 flex-shrink-0">
                            <span className="text-sm font-bold text-slate-400">{player.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="font-bold text-base block truncate">{player.name}</span>
                          <span className="text-xs text-slate-500">{assignedTeam ? `on ${assignedTeam.name}` : 'no team'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditPlayer(player.id)}
                          className="text-slate-500 hover:text-white p-2 transition-colors"
                          title="Edit player"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-slate-500 hover:text-red-500 p-2 transition-colors"
                          title="Delete player"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {players.length === 0 && (
                <p className="text-xs text-slate-500">Add at least two players to unlock the game hub.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="text-red-500" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Teams</h2>
              </div>
              <span className="text-xs text-slate-600">{teams.length} teams</span>
            </div>

            <div className="bg-slate-900/30 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">
                    {editingTeam ? 'Edit Team' : 'Create Team'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage teams here. Editing a team updates its name and roster in one place.
                  </p>
                </div>
                {editingTeam && (
                  <button
                    onClick={resetTeamForm}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={teamDraftName}
                  onChange={(e) => setTeamDraftName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                  placeholder="Team name..."
                  className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-xl px-3 py-2 focus:border-red-600 outline-none transition-all text-sm"
                />
                <button
                  onClick={handleSaveTeam}
                  className="bg-red-600 px-4 rounded-xl active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm min-w-20"
                  disabled={!teamDraftName.trim()}
                  title={editingTeam ? 'Save team' : 'Add team'}
                >
                  {editingTeam ? 'Save' : 'Add'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Players</h4>
                  <span className="text-xs text-slate-600">{teamDraftPlayerIds.length} selected</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                  {players.map((player) => {
                    const assignedTeam = getTeamForPlayer(player.id);
                    const isSelected = teamDraftPlayerIds.includes(player.id);
                    const isMovingFromAnotherTeam = assignedTeam && assignedTeam.id !== editingTeamId;

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => toggleTeamPlayerSelection(player.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{player.name}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {isSelected
                                ? 'Selected for this team'
                                : assignedTeam
                                  ? `Currently on ${assignedTeam.name}`
                                  : 'Unassigned'}
                            </div>
                          </div>
                          {isMovingFromAnotherTeam && !isSelected && (
                            <span className="text-[10px] uppercase tracking-widest text-amber-400">Moves</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {players.length === 0 && (
                <p className="text-xs text-slate-500">Add players first, then create teams from them.</p>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Current Teams</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-700/30 text-slate-400">
                  {unassignedPlayers.length} unassigned
                </span>
              </div>

              {teams.length === 0 ? (
                <p className="text-sm text-slate-500">No teams yet. Team games stay optional until you add one.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {teams.map((team) => {
                    const playerNames = team.playerIds
                      .map((playerId) => players.find((player) => player.id === playerId)?.name)
                      .filter((name): name is string => Boolean(name));

                    return (
                      <motion.div
                        layout="position"
                        key={team.id}
                        className="bg-slate-950/50 p-4 rounded-xl border border-slate-700 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                              <span className="font-bold text-sm truncate">{team.name}</span>
                              <span className="text-xs text-slate-500">({team.playerIds.length} players)</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                              {playerNames.length > 0 ? playerNames.join(', ') : 'No players assigned'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditTeam(team.id)}
                              className="text-slate-500 hover:text-red-500 p-1.5"
                              title="Edit team"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleRemoveTeam(team.id)}
                              className="text-slate-500 hover:text-red-500 p-1.5"
                              title="Remove team"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {unassignedPlayers.length > 0 && (
                <p className="text-xs text-slate-500">
                  Unassigned players: {unassignedPlayers.map((player) => player.name).join(', ')}
                </p>
              )}

              {teams.length > 0 && (
                <p className="text-xs text-slate-500">
                  Tick Tack Boom works with players only. In Taboo, you pick any two populated teams before the match.
                </p>
              )}
            </div>
          </section>

        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          <button
            onClick={handleComplete}
            disabled={!hasPlayers}
            className={`w-full py-4 rounded-2xl font-black text-xl transition-all flex items-center justify-center space-x-2 ${hasPlayers
              ? 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            <span>Start Playing</span>
            <ArrowRight size={20} />
          </button>

          {!hasPlayers && (
            <p className="text-center text-xs text-slate-600">
              Add at least 2 players to start
            </p>
          )}
        </div>
      </div>
    );
  };
