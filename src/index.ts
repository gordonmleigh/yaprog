import throttle from 'lodash.throttle';

export interface ProgressBarOptions {
  completeChar?: string;
  incompleteChar?: string;
  renderThrottle?: number;
  start?: number;
  stream?: NodeJS.WriteStream;
  tokens?: ProgressBarTokens;
  total?: number;
  width?: number;
}

export interface ProgressBarTokens {
  [key: string]: any;
}

export interface ProgressBar {
  progress: number;
  total: number;
  tokens: ProgressBarTokens;
  clear(): void;
  finish(): void;
  log(message: string, tokens?: ProgressBarTokens): void;
  render(force?: boolean, tokens?: ProgressBarTokens): void;
  update(current: number, total?: number, tokens?: ProgressBarTokens): void;
  update(current: number, tokens: ProgressBarTokens): void;
}

export function makeProgressBar(
  barFormat: string,
  optsOrTotal: ProgressBarOptions | number = 0,
): ProgressBar {
  const {
    completeChar = '█',
    incompleteChar = '░',
    renderThrottle = 16,
    start = Date.now(),
    stream = process.stderr,
    tokens: initialTokens = {},
    total: initialTotal = 0,
    width = 40,
  } = typeof optsOrTotal === 'number' ? { total: optsOrTotal } : optsOrTotal;

  const isTTY = !!stream.isTTY; // this is actually undefined for non-TTYs
  let savedTokens: ProgressBarTokens = initialTokens || {};

  let lastRenderTime = 0;
  let lastRenderText = '';
  let current = 0;
  let total = initialTotal;

  function clear() {
    if (!isTTY) {
      return;
    }
    stream.clearLine(0);
    stream.cursorTo(0);
  }

  function finish() {
    if (!isTTY) {
      return;
    }
    stream.write('\n');
  }

  function log(message: string, tokens?: ProgressBarTokens): void {
    const progress = current / total;
    const percent = Math.floor(100 * progress);
    const elapsed = (Date.now() - start) / 1000;

    message = replaceTokens(message, {
      elapsed: elapsed.toFixed(0),
      percent: percent + '%',
      rate: current / elapsed,
      ...savedTokens,
      ...tokens,
      current,
      total,
    });
    const nl = message.indexOf('\n');

    if (nl < 0) {
      overwriteLine(message);
    } else {
      overwriteLine(message.slice(0, nl));
      stream.write(message.slice(nl + 1));
      stream.write('\n');
    }

    if (lastRenderText) {
      stream.write(lastRenderText);
    }
  }

  function overwriteLine(message: string): void {
    if (!isTTY) {
      stream.write(message);
    } else {
      stream.cursorTo(0);
      stream.write(message);
      stream.clearLine(1);
    }
    stream.write('\n');
  }

  function render(force = false, tokens?: ProgressBarTokens): void {
    if (!isTTY) {
      return;
    }
    savedTokens = { ...savedTokens, ...tokens };

    // throttle rendering to improve performance
    const now = Date.now();
    if (!force && now - lastRenderTime < renderThrottle) {
      return;
    }
    lastRenderTime = now;

    const progress = current / total;
    const percent = Math.floor(100 * progress);
    const elapsed = (now - start) / 1000;

    let barText = replaceTokens(barFormat, {
      elapsed: elapsed.toFixed(0),
      percent: percent + '%',
      rate: current / elapsed,
      ...savedTokens,
      current,
      total,
    });

    const outLength = replaceTokens(barText, { bar: '' }).length;
    const availableWidth = Math.max(0, stream.columns - outLength);
    const renderWidth = Math.min(availableWidth, width);

    const barLength = Math.floor(progress * renderWidth);

    const bar = ''
      .padEnd(barLength, completeChar)
      .padEnd(renderWidth, incompleteChar);

    barText = replaceTokens(barText, { bar });

    if (lastRenderText !== barText) {
      lastRenderText = barText;
      stream.cursorTo(0);
      stream.write(barText);
      stream.clearLine(1);
    }
  }

  function update(
    current: number,
    total?: number,
    tokens?: ProgressBarTokens,
  ): void;
  function update(current: number, tokens: ProgressBarTokens): void;
  function update(
    newCurrent: number,
    newTotal?: number | ProgressBarTokens,
    tokens?: ProgressBarTokens,
  ): void {
    if (typeof newTotal !== 'number') {
      tokens = newTotal;
      newTotal = undefined;
    }
    current = newCurrent;
    if (typeof newTotal !== 'undefined') {
      total = newTotal;
    }
    render(false, tokens);
  }

  return {
    get progress(): number {
      return current;
    },

    set progress(value: number) {
      current = value;
    },

    get total(): number {
      return total;
    },

    set total(value: number) {
      total = value;
    },

    get tokens(): ProgressBarTokens {
      return savedTokens;
    },

    set tokens(value: ProgressBarTokens) {
      savedTokens = value;
    },

    clear,
    finish,
    log,
    render: renderThrottle ? throttle(render, renderThrottle) : render,
    update,
  };
}

function replaceTokens(str: string, tokens: ProgressBarTokens): string {
  for (const token in tokens) {
    let value: any;
    if (typeof tokens[token] === 'function') {
      value = tokens[token](tokens);
    } else {
      value = tokens[token].toString();
    }
    str = str.replace(new RegExp(`:${token}(:|\\b)`, 'g'), value);
  }
  return str;
}
