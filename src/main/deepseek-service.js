class DeepSeekService {
  constructor(baseUrl = 'https://api.deepseek.com') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getBalance(apiKey) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (response.status === 401) {
        return { ok: false, error: 'auth' };
      }
      if (response.status === 403) {
        return { ok: false, error: 'forbidden' };
      }
      if (response.status === 429) {
        return { ok: false, error: 'rate_limit' };
      }
      if (response.status >= 500) {
        return { ok: false, error: 'server', status: response.status };
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return { ok: false, error: 'json' };
      }

      if (!response.ok) {
        return { ok: false, error: 'http', status: response.status };
      }

      const balances = Array.isArray(data.balance_infos)
        ? data.balance_infos.map((item) => ({
            currency: String(item.currency || 'CNY'),
            totalBalance: String(item.total_balance || '0.00'),
            grantedBalance: String(item.granted_balance || '0.00'),
            toppedUpBalance: String(item.topped_up_balance || '0.00'),
          }))
        : [];

      return {
        ok: true,
        isAvailable: Boolean(data.is_available),
        balances,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: 'timeout' };
      }
      return { ok: false, error: 'network', message: error.message };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { DeepSeekService };
