import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Search,
  Loader2,
  MessageSquare,
  Trophy,
  ShieldCheck,
  UserCheck,
  Clock,
  Send,
  Swords,
  Zap,
  Shield,
  Crown
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { cn } from '@/lib/utils';
import { ApiError, apiJson } from '@/lib/api-client';
import { useSignalR } from '@/context/SignalRContext';

type Friend = {
  userId: string;
  displayName: string;
  status: 'None' | 'Pending' | 'Accepted' | 'Declined';
  since: string;
  friendshipId: number;
};

const BATTLE_MODES = [
  { label: 'First to solve', value: 1, icon: Zap },
  { label: 'Timed', value: 2, icon: Shield },
  { label: 'Survival', value: 3, icon: Crown },
];

export default function CommunityPage() {
  const { messages, sendPrivateMessage, challenges, acceptChallenge, dismissChallenge, challengeFriend } = useSignalR();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeChatUser, setActiveChatUser] = useState<Friend | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showInviteModal, setShowInviteModal] = useState<Friend | null>(null);
  const [friendScores, setFriendScores] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        apiJson<Friend[]>('/api/Friendship', { auth: true }),
        apiJson<Friend[]>('/api/Friendship/pending', { auth: true }),
      ]);
      setFriends(f);
      setPending(p);
      // Also fetch friends' leaderboard scores so UI shows authoritative RankPoints
      try {
        const lb = await apiJson<Array<{ userId: string; rankPoints: number }>>('/api/Leaderboard/friends', { auth: true });
        const map: Record<string, number> = {};
        lb.forEach((e) => { map[e.userId] = e.rankPoints; });
        setFriendScores(map);
      } catch {
        // ignore leaderboard fetch failures — keep placeholders
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load community data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatUser]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await apiJson<Friend[]>(`/api/Friendship/search?q=${encodeURIComponent(searchQuery)}`, { auth: true });
      setSearchResults(results);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId: string) => {
    try {
      await apiJson(`/api/Friendship/request/${userId}`, { method: 'POST', auth: true });
      setSearchResults(prev => prev.filter(u => u.userId !== userId));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to send request');
    }
  };

  const acceptRequest = async (friendshipId: number) => {
    try {
      await apiJson(`/api/Friendship/accept/${friendshipId}`, { method: 'POST', auth: true });
      fetchData();
    } catch (e) {
      alert('Failed to accept request');
    }
  };

  const declineRequest = async (friendshipId: number) => {
    try {
      await apiJson(`/api/Friendship/decline/${friendshipId}`, { method: 'POST', auth: true });
      fetchData();
    } catch (e) {
      alert('Failed to decline request');
    }
  };

  const removeFriend = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await apiJson(`/api/Friendship/${userId}`, { method: 'DELETE', auth: true });
      fetchData();
    } catch (e) {
      alert('Failed to remove friend');
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !chatInput.trim()) return;
    try {
      await sendPrivateMessage(activeChatUser.userId, chatInput);
      setChatInput('');
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  const handleInviteToBattle = async (mode: number) => {
    if (!showInviteModal) return;
    try {
      await challengeFriend(showInviteModal.userId, mode);
      setShowInviteModal(null);
      alert('Challenge sent!');
    } catch (e) {
      alert('Failed to send challenge');
    }
  };

  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="mb-8">
            <div className="mb-1 font-mono text-xs text-primary">COMMUNITY/</div>
            <h1 className="font-display text-3xl font-bold">Friends & Community</h1>
            <p className="mt-2 text-muted-foreground">Connect with other learners, challenge friends, and track progress together.</p>
            {error && (
              <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Incoming Challenges Notification */}
          <AnimatePresence>
            {challenges.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 overflow-hidden"
              >
                {challenges.map((c) => (
                  <div key={c.challengeId} className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-warning/20 text-warning">
                        <Swords className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold">Challenge Received!</span>
                        <p className="text-sm text-muted-foreground">User {c.fromUserId} challenged you to a battle.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptChallenge(c.challengeId)}
                        className="rounded-lg bg-warning px-4 py-2 text-sm font-bold text-warning-foreground"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => dismissChallenge(c.challengeId)}
                        className="rounded-lg border border-warning/20 px-4 py-2 text-sm font-medium hover:bg-warning/10"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="space-y-8">
              {/* Search Section */}
              <section className="rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center gap-2 font-mono text-xs text-primary">
                  <Search className="h-3.5 w-3.5" /> SEARCH_USERS/
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by username or display name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <button
                    disabled={searching}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:shadow-glow disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {searchResults.map((u) => (
                      <div key={u.userId} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4 transition-colors hover:bg-background">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{u.displayName}</div>
                            <div className="text-xs text-muted-foreground">Level 1 Beginner</div>
                          </div>
                        </div>
                        <button
                          onClick={() => sendRequest(u.userId)}
                          className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Friends List */}
              <section className="rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center gap-2 font-mono text-xs text-primary">
                  <UserCheck className="h-3.5 w-3.5" /> MY_FRIENDS/
                </div>
                {loading ? (
                  <div className="flex py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading friends...
                  </div>
                ) : friends.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {friends.map((f) => (
                      <div key={f.userId} className="group relative flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/30 hover:bg-background">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                            <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="font-semibold">{f.displayName}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Trophy className="h-3 w-3 text-warning" /> {friendScores[f.userId] ? `${friendScores[f.userId].toLocaleString()} pts` : '— pts'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => setActiveChatUser(f)}
                            className="rounded-md bg-surface p-2 text-muted-foreground hover:text-primary"
                            title="Chat"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowInviteModal(f)}
                            className="rounded-md bg-surface p-2 text-muted-foreground hover:text-warning"
                            title="Challenge to Battle"
                          >
                            <Swords className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFriend(f.userId)}
                            className="rounded-md bg-surface p-2 text-muted-foreground hover:text-destructive"
                            title="Remove Friend"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    <p>No friends yet. Start searching to build your community!</p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar: Chat & Pending */}
            <div className="space-y-6">
              {/* Chat Panel */}
              <section className="flex h-[500px] flex-col rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="border-b border-border bg-background/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", activeChatUser ? "bg-success" : "bg-muted")} />
                      <span className="text-sm font-bold">{activeChatUser ? `Chat with ${activeChatUser.displayName}` : 'Select a friend to chat'}</span>
                    </div>
                    {activeChatUser && (
                      <button onClick={() => setActiveChatUser(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!activeChatUser ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                      <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
                      <p className="text-xs">Select a friend from your list to start a real-time conversation.</p>
                    </div>
                  ) : (
                    <>
                      {(messages[activeChatUser.userId] || []).map((msg, i) => {
                        const isMe = msg.fromUserId === 'me';
                        return (
                          <div key={i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                            <div className="mb-1 text-[10px] text-muted-foreground">
                              {isMe ? 'You' : msg.fromUserName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={cn(
                              "rounded-lg p-3 text-sm border max-w-[90%]",
                              isMe ? "bg-primary/10 border-primary/20 text-foreground" : "bg-background border-border/50"
                            )}>
                              {msg.message}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {activeChatUser && (
                  <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-background/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                      />
                      <button type="submit" className="text-primary hover:text-primary/80">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {pending.length > 0 && (
                <section className="rounded-2xl border border-border bg-surface p-6">
                  <div className="mb-4 flex items-center gap-2 font-mono text-xs text-warning">
                    <Clock className="h-3.5 w-3.5" /> PENDING_REQUESTS/
                  </div>
                  <div className="space-y-4">
                    {pending.map((p) => (
                      <div key={p.userId} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{p.displayName}</div>
                          <div className="text-[10px] text-muted-foreground">wants to be friends</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => acceptRequest(p.friendshipId)}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-success/20 text-success hover:bg-success/30"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => declineRequest(p.friendshipId)}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Challenge {showInviteModal.displayName}</h2>
                  <button onClick={() => setShowInviteModal(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">Choose a battle mode for your challenge:</p>
                  {BATTLE_MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => handleInviteToBattle(m.value)}
                      className="flex w-full items-center gap-4 rounded-xl border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <m.icon className="h-5 w-5" />
                      </div>
                      <span className="font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageTransition>
    </AppShell>
  );
}
