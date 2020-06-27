# yaprog: Yet Another Progress Bar

## What

A command line progress bar for NodeJS.

## How

### Quick Start

```typescript
import { makeProgressBar } from 'yaprog';

const bar = makeProgressBar(`uploading [:bar] :current/:total :custom`, 100);

// set
bar.update(10, { custom: 'replacement text' });

// interrupt the bar and log some text
bar.interrupt(`Some log message here!`);
```

### ProgressBarOptions interface

```typescript
interface ProgressBarOptions {
  completeChar?: string; // defaults to '█'
  incompleteChar?: string; // defaults to '░'
  renderThrottle?: number; // defaults to 16ms (60fps)
  start?: number; // defaults to Date.now()
  stream?: NodeJS.WriteStream; // defaults to process.stderr
  total?: number; // defaults to 0
  width?: number; // defaults to 40
}
```

### ProgressBar interface

```typescript
interface ProgressBar {
  clear(): void;
  getProgress(): number;
  getTotal(): number;
  log(message: string, tokens?: ProgressBarTokens): void;
  render(force?: boolean, tokens?: ProgressBarTokens): void;
  setTotal(value: number): void;
  update(current: number, total?: number, tokens?: ProgressBarTokens): void;
  update(current: number, tokens: ProgressBarTokens): void;
}
```

### ProgressBarTokens interface

```typescript
interface ProgressBarTokens {
  [key: string]: any;
}
```

## Why

This is based on [progress](https://www.npmjs.com/package/progress), but simplifies the interface and fixes some bugs.
