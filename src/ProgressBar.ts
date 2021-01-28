import { ConsoleStatus } from './ConsoleStatus';
import { replaceTokens, TokenCollection } from './replaceTokens';

export interface ProgressBarTokens {
  [key: string]: any;
}

export interface ProgressBarOptions {
  completeChar?: string;
  incompleteChar?: string;
  renderThrottle?: number;
  start?: number;
  stream?: NodeJS.WriteStream;
  tokens?: TokenCollection;
  total?: number;
  width?: number;
}

export interface ProgressBar {
  progress: number;
  total: number;
  tokens: TokenCollection;
  clear(): void;
  finish(): void;
  log(message: string, tokens?: TokenCollection): void;
  render(force?: boolean, tokens?: TokenCollection): void;
  update(current: number, total?: number, tokens?: TokenCollection): void;
  update(current: number, tokens: TokenCollection): void;
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
    width: maxWidth = 40,
  } = typeof optsOrTotal === 'number' ? { total: optsOrTotal } : optsOrTotal;

  let savedTokens: TokenCollection = initialTokens || {};
  let current = 0;
  let total = initialTotal;

  const output = new ConsoleStatus({
    fps: 1000 / renderThrottle,
    progress: {
      completeChar,
      incompleteChar,
      maxWidth,
    },
    stream,
  });

  function clear() {
    output.endStatus(true);
  }

  function draw() {
    const now = Date.now();
    const progress = current / total;
    const percent = Math.floor(100 * progress);
    const elapsed = (now - start) / 1000;

    output.progress(
      current / total,
      replaceTokens(barFormat, savedTokens, {
        bar: ':bar:',
        elapsed: elapsed.toFixed(0),
        percent: percent + '%',
        rate: current / elapsed,
        ...savedTokens,
        current,
        total,
      }),
    );
  }

  function finish() {
    output.endStatus();
  }

  function log(message: string, tokens?: TokenCollection): void {
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

    output.log(message);
  }

  function render() {
    output.render();
  }

  function update(
    current: number,
    total?: number,
    tokens?: TokenCollection,
  ): void;
  function update(current: number, tokens: TokenCollection): void;
  function update(
    newCurrent: number,
    newTotal?: number | TokenCollection,
    tokens?: TokenCollection,
  ): void {
    if (typeof newTotal !== 'number' && typeof newTotal !== 'undefined') {
      tokens = newTotal;
      newTotal = undefined;
    }
    current = newCurrent;
    if (typeof newTotal !== 'undefined') {
      total = newTotal;
    }

    savedTokens = { ...savedTokens, ...tokens };
    draw();
  }

  return {
    get progress(): number {
      return current;
    },

    set progress(value: number) {
      current = value;
      draw();
    },

    get total(): number {
      return total;
    },

    set total(value: number) {
      total = value;
      draw();
    },

    get tokens(): TokenCollection {
      return savedTokens;
    },

    set tokens(value: TokenCollection) {
      savedTokens = value;
      draw();
    },

    clear,
    finish,
    log,
    render,
    update,
  };
}
