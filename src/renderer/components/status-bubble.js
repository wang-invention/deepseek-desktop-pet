const FRIENDLY_ERRORS = {
  auth: "API Key 好像不对哦～",
  forbidden: "没有权限访问余额接口～",
  rate_limit: "请求太频繁啦，休息一下再试～",
  timeout: "请求超时了，再试一次～",
  network: "网络好像断掉啦～",
  json: "返回的数据看不懂，可能是服务异常～",
  server: "DeepSeek 服务好像开小差了～",
  http: "DeepSeek 服务好像开小差了～",
};

export class StatusBubble {
  constructor(element) {
    this.element = element;
  }

  render(state, config) {
    const lines = [];
    let detail = "";
    let clickable = false;

    if (state.status === "LOADING") {
      lines.push("等一下哦～", "我帮你看看余额！");
    } else if (state.status === "NO_API_KEY") {
      lines.push("主人还没有告诉我 API Key 哦～");
      lines.push("点这里去设置");
      clickable = true;
    } else if (state.status === "ERROR") {
      lines.push("呜……查不到余额了。");
      detail = FRIENDLY_ERRORS[state.error] || "网络好像断掉啦～";
      if (state.error === "auth") {
        clickable = true;
      }
    } else {
      const total = state.balances && state.balances[0];
      const text = total ? this.format(total.totalBalance, total.currency) : "--";
      if (state.status === "SUCCESS") {
        lines.push("查到了！", `现在还有 ${text}～`);
      } else {
        lines.push("主人～", config && config.hasApiKey ? `余额还有 ${text} 哦` : "还没有余额信息哦");
      }
    }

    this.element.innerHTML = lines
      .map((line) => `<span>${line}</span>`)
      .join("\n");
    if (detail) {
      this.element.insertAdjacentHTML("beforeend", `<span class="error-detail">${detail}</span>`);
    }
    this.element.classList.toggle("clickable", clickable);
  }

  format(value, currency) {
    const symbol = currency === "USD" ? "$" : currency === "CNY" ? "¥" : currency ? `${currency} ` : "¥";
    return `${symbol}${Number(value || 0).toFixed(2)}`;
  }
}
