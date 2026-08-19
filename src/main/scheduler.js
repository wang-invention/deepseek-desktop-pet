function createScheduler({ getConfig, onTick }) {
  let timer = null;

  function start() {
    stop();
    const { autoRefresh, refreshInterval } = getConfig();
    const seconds = Number(refreshInterval);
    if (autoRefresh && seconds > 0) {
      timer = setInterval(onTick, seconds * 1000);
    }
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return { start, stop, restart: start };
}

module.exports = { createScheduler };
