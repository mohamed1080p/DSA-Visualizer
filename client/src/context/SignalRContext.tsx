import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './use-auth';
import { readStoredAuth } from '@/lib/auth-storage';
import { refreshStoredAuthToken } from '@/lib/api-client';

interface ChatMessage {
  fromUserId: string;
  fromUserName: string;
  message: string;
  timestamp: string;
}

interface FriendChallenge {
  challengeId: string;
  fromUserId: string;
  mode: number;
}

interface BattleOpponent {
  displayName?: string;
  userId?: string;
}

interface BattleProblem {
  id: string;
  order?: number;
  title: string;
  description?: string;
  difficulty?: string;
  points?: number;
  isSolved?: boolean;
}

interface BattleSessionView {
  battleId?: string;
  id?: string;
  mode?: string;
  timeLimitSeconds?: number;
  problemsToWin?: number;
  opponent?: BattleOpponent;
  participants?: { userId: string; displayName: string; solvedCount?: number }[];
  problems: BattleProblem[];
  [key: string]: unknown;
}

interface BattleResult {
  winnerUserId?: string | null;
  participants?: { userId: string; displayName: string; solvedCount?: number }[];
}

interface ChatNotification {
  id: string;
  fromUserId: string;
  fromUserName: string;
  message: string;
  timestamp: string;
}

interface SignalRContextType {
  communityConnection: signalR.HubConnection | null;
  battleConnection: signalR.HubConnection | null;
  messages: Record<string, ChatMessage[]>; // userId -> messages
  challenges: FriendChallenge[];
  currentBattle: BattleSessionView | null;
  battleResult: BattleResult | null;
  chatNotifications: ChatNotification[];
  sendPrivateMessage: (toUserId: string, message: string) => Promise<void>;
  challengeFriend: (friendUserId: string, mode: number) => Promise<void>;
  acceptChallenge: (challengeId: string) => Promise<void>;
  dismissChallenge: (challengeId: string) => void;
  submitBattleCode: (battleId: string, problemOrder: number, code: string, language: string) => Promise<unknown>;
  surrenderBattle: (battleId: string) => Promise<void>;
  joinBattle: (battleId: string) => Promise<void>;
  leaveBattle: () => void;
  setBattle: (battle: BattleSessionView) => void;
  clearBattleResult: () => void;
  dismissChatNotification: (id: string) => void;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

function isAccessTokenExpiringSoon(token: string, skewSeconds = 30) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    if (!parsed.exp) return true;
    return parsed.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

async function getSignalRAccessToken(fallbackToken: string) {
  const stored = readStoredAuth();
  if (stored?.accessToken && isAccessTokenExpiringSoon(stored.accessToken)) {
    await refreshStoredAuthToken();
  }

  return readStoredAuth()?.accessToken ?? fallbackToken;
}

export function SignalRProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, user } = useAuth();
  const token = user?.accessToken;
  const [communityConnection, setCommunityConnection] = useState<signalR.HubConnection | null>(null);
  const [battleConnection, setBattleConnection] = useState<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [challenges, setChallenges] = useState<FriendChallenge[]>([]);
  const [currentBattle, setCurrentBattle] = useState<BattleSessionView | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (communityConnection) communityConnection.stop();
      if (battleConnection) battleConnection.stop();
      setCurrentBattle(null);
      return;
    }

    const communityConn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/community', {
        accessTokenFactory: () => getSignalRAccessToken(token)
      })
      .withAutomaticReconnect()
      .build();

    const battleConn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/battle', {
        accessTokenFactory: () => getSignalRAccessToken(token)
      })
      .withAutomaticReconnect()
      .build();

    communityConn.on('ReceivePrivateMessage', (msg: any) => {
      console.log('SignalR: Received private message', msg);
      const fromUserId = msg.fromUserId || msg.FromUserId;
      const fromUserName = msg.fromUserName || msg.FromUserName;
      const message = msg.message || msg.Message;
      const timestamp = msg.timestamp || msg.Timestamp;

      setMessages(prev => {
        const otherUserId = fromUserId;
        const userMsgs = prev[otherUserId] || [];
        return { ...prev, [otherUserId]: [...userMsgs, { fromUserId, fromUserName, message, timestamp }] };
      });

      // Push a toast notification
      const notifId = `${fromUserId}-${Date.now()}`;
      setChatNotifications(prev => [
        ...prev,
        { id: notifId, fromUserId, fromUserName, message, timestamp },
      ]);
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setChatNotifications(prev => prev.filter(n => n.id !== notifId));
      }, 5000);
    });

    communityConn.on('MessageSent', (msg: any) => {
      console.log('SignalR: Message sent confirmed', msg);
      const toUserId = msg.toUserId || msg.ToUserId;
      const message = msg.message || msg.Message;
      const timestamp = msg.timestamp || msg.Timestamp;

      setMessages(prev => {
        const otherUserId = toUserId;
        const userMsgs = prev[otherUserId] || [];
        const myMsg: ChatMessage = {
          fromUserId: 'me',
          fromUserName: 'You',
          message: message,
          timestamp: timestamp
        };
        return { ...prev, [otherUserId]: [...userMsgs, myMsg] };
      });
    });

    battleConn.on('FriendChallenge', (challenge: FriendChallenge) => {
      setChallenges(prev => [...prev, challenge]);
    });

    battleConn.on('MatchFound', (battle: BattleSessionView) => {
      console.log('SignalR: Match found!', battle);
      setCurrentBattle(battle);
    });

    battleConn.on('BattleFinished', (battle: any) => {
      console.log('SignalR: Battle finished', battle);
      const winnerUserId = battle?.winnerUserId ?? battle?.WinnerUserId ?? null;
      const participants = battle?.participants ?? battle?.Participants ?? [];
      setBattleResult({ winnerUserId, participants });
      setCurrentBattle(null);
    });

    communityConn.start()
      .then(() => {
        console.log('SignalR: CommunityHub connected');
        setCommunityConnection(communityConn);
      })
      .catch(err => console.error('SignalR: CommunityHub connection failed', err));

    battleConn.start()
      .then(() => {
        console.log('SignalR: BattleHub connected');
        setBattleConnection(battleConn);
      })
      .catch(err => console.error('SignalR: BattleHub connection failed', err));

    return () => {
      communityConn.stop();
      battleConn.stop();
    };
  }, [isAuthenticated, token]);

  const sendPrivateMessage = async (toUserId: string, message: string) => {
    if (communityConnection?.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR: Send attempted while disconnected');
      throw new Error('Chat connection not established');
    }
    await communityConnection.invoke('SendPrivateMessage', toUserId, message);
  };

  const challengeFriend = async (friendUserId: string, mode: number) => {
    if (battleConnection?.state !== signalR.HubConnectionState.Connected) return;

    await battleConnection.invoke('ChallengeFriend', friendUserId, mode);
  };

  const acceptChallenge = async (challengeId: string) => {
    if (battleConnection?.state !== signalR.HubConnectionState.Connected) return;

    await battleConnection.invoke('AcceptChallenge', challengeId);
    setChallenges(prev => prev.filter(c => c.challengeId !== challengeId));
  };

  const submitBattleCode = async (battleId: string, problemOrder: number, code: string, language: string) => {
    if (battleConnection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Battle connection not established');
    }

    return await battleConnection.invoke('SubmitCode', battleId, problemOrder, code, language);
  };

  const surrenderBattle = async (battleId: string) => {
    if (battleConnection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Battle connection not established');
    }

    await battleConnection.invoke('SurrenderBattle', battleId);
    setCurrentBattle(null);
  };

  const joinBattle = async (battleId: string) => {
    if (battleConnection?.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Battle connection not established');
    }

    await battleConnection.invoke('JoinBattle', battleId);
  };

  const dismissChallenge = (challengeId: string) => {
    setChallenges(prev => prev.filter(c => c.challengeId !== challengeId));
  };

  const leaveBattle = () => {
    setCurrentBattle(null);
  };

  const setBattle = (battle: BattleSessionView) => {
    setCurrentBattle(battle);
  };

  const clearBattleResult = () => {
    setBattleResult(null);
  };

  const dismissChatNotification = (id: string) => {
    setChatNotifications(prev => prev.filter(n => n.id !== id));
  };

  const value = useMemo(() => ({
    communityConnection,
    battleConnection,
    messages,
    challenges,
    currentBattle,
    battleResult,
    chatNotifications,
    sendPrivateMessage,
    challengeFriend,
    acceptChallenge,
    dismissChallenge,
    submitBattleCode,
    surrenderBattle,
    joinBattle,
    leaveBattle,
    setBattle,
    clearBattleResult,
    dismissChatNotification,
  }), [
    communityConnection,
    battleConnection,
    messages,
    challenges,
    currentBattle,
    battleResult,
    chatNotifications,
    sendPrivateMessage,
    challengeFriend,
    acceptChallenge,
    dismissChallenge,
    submitBattleCode,
    surrenderBattle,
    joinBattle,
    leaveBattle,
    setBattle,
    clearBattleResult,
    dismissChatNotification,
  ]);

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
}

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) throw new Error('useSignalR must be used within SignalRProvider');
  return context;
};
