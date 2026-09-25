export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://www.saucedemo.com',
  users: {
    standard: process.env.STANDARD_USER ?? 'standard_user',
    lockedOut: process.env.LOCKED_OUT_USER ?? 'locked_out_user',
    problem: process.env.PROBLEM_USER ?? 'problem_user',
    performanceGlitch: process.env.PERFORMANCE_GLITCH_USER ?? 'performance_glitch_user',
    error: process.env.ERROR_USER ?? 'error_user',
    visual: process.env.VISUAL_USER ?? 'visual_user'
  },
  password: process.env.PASSWORD ?? 'secret_sauce',
  ai: {
    enabled: (process.env.ENABLE_AI_HEALING ?? 'false').toLowerCase() === 'true',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    cacheFile: process.env.AI_HEALING_CACHE_FILE ?? '.healing-cache.json'
  }
};
