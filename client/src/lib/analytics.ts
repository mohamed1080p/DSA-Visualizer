/**
 * Simple wrapper for Google Analytics (gtag.js) to track user interactions.
 */

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

type AnalyticsWindow = Window & {
  gtag?: GtagFn;
};

export const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  const browserWindow = globalThis.window as AnalyticsWindow | undefined;
  if (!browserWindow?.gtag) return;

  browserWindow.gtag('event', eventName, params);
  console.log(`[Analytics] Event: ${eventName}`, params);
};

export const AnalyticsEvents = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  REGISTER_SUCCESS: 'register_success',

  // Battle Arena
  BATTLE_JOIN_QUEUE: 'battle_join_queue',
  BATTLE_STARTED: 'battle_started',
  BATTLE_COMPLETED: 'battle_completed',
  BATTLE_SUBMISSION: 'battle_submission',

  // Problems & Code
  SUBMISSION_CREATED: 'submission_created',
  SUBMISSION_RESULT: 'submission_result',
  PROBLEM_VIEWED: 'problem_viewed',

  // AI & Help
  AI_CHAT_MESSAGE: 'ai_chat_message',
  AI_REVIEW_REQUESTED: 'ai_review_requested',
  HINT_REQUESTED: 'hint_requested',

  // Visualization
  TOPIC_VIEWED: 'topic_viewed',
  VISUALIZER_PLAY: 'visualizer_play',
};
