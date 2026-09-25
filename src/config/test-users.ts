import { env } from '@utils/env';

export const testUsers = {
  standard: { username: env.users.standard, password: env.password },
  lockedOut: { username: env.users.lockedOut, password: env.password },
  problem: { username: env.users.problem, password: env.password },
  performanceGlitch: { username: env.users.performanceGlitch, password: env.password },
  error: { username: env.users.error, password: env.password },
  visual: { username: env.users.visual, password: env.password }
};
