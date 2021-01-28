export interface ProgressOptions {
  completeChar?: string;
  incompleteChar?: string;
  maxWidth?: number | null;
  replacementToken?: string;
}

export interface ConsoleStatusOptions {
  fps?: number;
  progress?: ProgressOptions;
  stream?: NodeJS.WriteStream;
}

const DefaultCompleteChar = '█';
const DefaultIncompleteChar = '░';
const DefaultBarReplacementToken = ':bar:';
const DefaultMaxWidth = 40;
const DefaultFps = 15;

export class ConsoleStatus {
  private readonly interval: number | undefined;
  private lastRenderStatus: string | undefined;
  private lastRenderTime = 0;
  private readonly options: Required<ConsoleStatusOptions>;
  private readonly progressOptions: Required<ProgressOptions>;
  private renderTimeout?: NodeJS.Timeout;
  private statusText: string | undefined;
  private stream: NodeJS.WriteStream;

  constructor(options?: ConsoleStatusOptions) {
    this.options = {
      fps: DefaultFps,
      progress: {},
      stream: process.stdout,
      ...options,
    };
    this.progressOptions = {
      completeChar: DefaultCompleteChar,
      incompleteChar: DefaultIncompleteChar,
      maxWidth: DefaultMaxWidth,
      replacementToken: DefaultBarReplacementToken,
      ...options?.progress,
    };
    this.interval = this.options.fps
      ? Math.floor(1000 / this.options.fps)
      : undefined;
    this.stream = this.options.stream;
  }

  public endStatus(clear = false): void {
    if (this.statusText) {
      if (clear) {
        this.clearLine();
      } else {
        this.requestRender(true);
        this.stream.write('\n');
      }
      this.statusText = undefined;
    }
  }

  public log(message: string): void {
    if (this.statusText) {
      this.clearLine();
    }
    this.stream.write(message + '\n');
    this.requestRender(true);
  }

  public render(): void {
    this.requestRender(true);
  }

  public progress(value: number, status = ''): void {
    if (!this.stream.isTTY) {
      return;
    }

    const replacementIndex = status.indexOf(
      this.progressOptions.replacementToken,
    );

    const statusLength =
      replacementIndex >= 0
        ? status.length - this.progressOptions.replacementToken.length
        : status.length
        ? status.length + 1
        : 0;

    const availableWidth = Math.max(0, this.stream.columns - statusLength);

    const renderWidth = this.progressOptions.maxWidth
      ? Math.min(availableWidth, this.progressOptions.maxWidth)
      : availableWidth;

    const barLength = Math.floor(value * renderWidth);

    const bar = ''
      .padEnd(barLength, this.progressOptions.completeChar)
      .padEnd(renderWidth, this.progressOptions.incompleteChar);

    if (replacementIndex >= 0) {
      this.status(
        status.slice(0, replacementIndex) +
          bar +
          status.slice(
            replacementIndex + this.progressOptions.replacementToken.length,
          ),
      );
    } else if (status) {
      this.status(bar + ' ' + status);
    } else {
      this.status(bar);
    }
  }

  public status(status: string | undefined): void {
    if (this.statusText && !status) {
      this.clearLine();
    }
    this.statusText = status || undefined;
    if (status) {
      this.requestRender();
    }
  }

  private cancelRender(): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = undefined;
    }
  }

  private clearLine(): void {
    if (this.stream.isTTY) {
      this.stream.cursorTo(0);
      this.stream.clearLine(1);
    }
  }

  private doRender(force = false) {
    this.cancelRender();

    if (!this.statusText || !this.stream.isTTY) {
      return;
    }

    if (force || this.statusText !== this.lastRenderStatus) {
      this.stream.cursorTo(0);
      this.stream.write(this.statusText);
      this.stream.clearLine(1);
      this.lastRenderStatus = this.statusText;
      this.lastRenderTime = Date.now();
    }
  }

  private requestRender(force = false): void {
    if (!this.stream.isTTY) {
      return;
    }
    if (!this.interval || force) {
      // no limiting, render every time
      this.doRender(force);
      return;
    }

    const elapsed = Date.now() - this.lastRenderTime;

    if (elapsed > this.interval) {
      this.doRender();
    } else if (!this.renderTimeout) {
      this.renderTimeout = setTimeout(
        () => this.doRender(),
        this.interval - elapsed,
      );
      this.renderTimeout.unref();
    }
  }
}
