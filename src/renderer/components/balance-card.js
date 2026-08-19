export class BalanceCard {
  constructor(element) {
    this.element = element;
    this.total = element.querySelector("#balance-total");
    this.updated = element.querySelector("#updated-label");
    this.detail = element.querySelector("#balance-detail");
  }

  render(state) {
    if (state.status === "LOADING") {
      this.total.textContent = "查询中…";
      this.total.classList.add("is-loading");
      this.updated.textContent = "正在更新";
      this.detail.textContent = "DeepSeek 正在帮你看余额";
      return;
    }

    this.total.classList.remove("is-loading");
    if (state.status === "SUCCESS" && state.balances.length) {
      const first = state.balances[0];
      this.total.textContent = this.format(first.totalBalance, first.currency);
      this.detail.innerHTML = state.balances
        .map(
          (item) =>
            `充值 ${this.format(item.toppedUpBalance, item.currency)} · 赠送 ${this.format(
              item.grantedBalance,
              item.currency,
            )}`,
        )
        .join("<br>");
      this.updated.textContent = state.updatedAt ? `● ${this.relativeTime(state.updatedAt)}更新` : "刚刚更新";
      return;
    }

    this.total.textContent = "--";
    this.detail.textContent =
      state.status === "NO_API_KEY" ? "请先在设置中配置 API Key" : state.status === "ERROR" ? "余额获取失败" : "等待刷新";
    this.updated.textContent = "未更新";
  }

  format(value, currency) {
    const symbol = currency === "USD" ? "$" : currency === "CNY" ? "¥" : currency ? `${currency} ` : "¥";
    return `${symbol}${Number(value || 0).toFixed(2)}`;
  }

  relativeTime(timestamp) {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) {
      return "刚刚";
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} 分钟前`;
    }
    return `${Math.floor(minutes / 60)} 小时前`;
  }
}
