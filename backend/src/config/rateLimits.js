const DEFAULT_LIMITS = {
  auth: {
    login: { max: 5, windowMs: 15 * 60 * 1000 },
    register: { max: 3, windowMs: 60 * 60 * 1000 },
    passwordReset: { max: 3, windowMs: 60 * 60 * 1000 },
    passwordRecovery: { max: 3, windowMs: 60 * 60 * 1000 },
    tokenRefresh: { max: 10, windowMs: 15 * 60 * 1000 },
    logout: { max: 20, windowMs: 60 * 60 * 1000 },
  },
  financial: {
    transaction: { max: 30, windowMs: 60 * 1000 },
    metalOperation: { max: 20, windowMs: 60 * 1000 },
    sale: { max: 30, windowMs: 60 * 1000 },
    expense: { max: 20, windowMs: 60 * 1000 },
    report: { max: 10, windowMs: 60 * 1000 },
  },
  public: {
    health: { max: 100, windowMs: 60 * 1000 },
    knowledge: { max: 50, windowMs: 60 * 1000 },
    catalog: { max: 60, windowMs: 60 * 1000 },
    rateSync: { max: 5, windowMs: 60 * 60 * 1000 },
  },
  default: { max: 100, windowMs: 60 * 1000 },
};

const IP_LIMITS = {
  auth: { max: 20, windowMs: 15 * 60 * 1000 },
  financial: { max: 100, windowMs: 60 * 1000 },
  public: { max: 200, windowMs: 60 * 1000 },
  default: { max: 200, windowMs: 60 * 1000 },
};

export function getLimitConfig(category, endpoint) {
  if (DEFAULT_LIMITS[category] && DEFAULT_LIMITS[category][endpoint]) {
    return DEFAULT_LIMITS[category][endpoint];
  }
  return DEFAULT_LIMITS.default;
}

export function getIpLimitConfig(category) {
  return IP_LIMITS[category] || IP_LIMITS.default;
}

export { DEFAULT_LIMITS, IP_LIMITS };