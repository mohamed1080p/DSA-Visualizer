export function isActiveBattleStatus(status: unknown): boolean {
  if (status === 1 || status === '1' || status === 'WaitingForPlayers') return true;
  if (status === 2 || status === '2' || status === 'InProgress') return true;
  return false;
}

export function getBattleStatus(battle: Record<string, unknown> | null | undefined): unknown {
  if (!battle) return undefined;
  return battle.status ?? battle.Status;
}
