import { makeProgressBar, ProgressBarTokens } from '.';

async function testRenderDefaults(): Promise<void> {
  const bar = makeProgressBar(
    'test :bar render defaults :percent (:current/:total) :custom :elapsed:s',
    20,
  );
  const total = 10;

  for (let i = 1; i <= total; ++i) {
    bar.update(i, total, { custom: i * Math.PI });
    await delay();
  }

  bar.finish();
}

async function testLog(): Promise<void> {
  const bar = makeProgressBar(
    'test :bar logging :percent (:current/:total) :custom',
    20,
  );
  const total = 10;

  for (let i = 1; i <= total; ++i) {
    bar.update(i, total, { custom: i * Math.PI });
    if (i % 2 === 0) {
      bar.log(`:remaining to go (of :total)`, { remaining: total - i });
    }
    await delay();
  }

  bar.finish();
}

async function testFunctionToken(): Promise<void> {
  const bar = makeProgressBar(
    'test :bar logging :percent (:pcurrent/:ptotal) :pi',
    {
      total: 20,
      tokens: {
        pcurrent: (tokens: ProgressBarTokens) =>
          (tokens.current / 1000).toFixed(0),
        ptotal: (tokens: ProgressBarTokens) => (tokens.total / 1000).toFixed(0),
      },
    },
  );
  const total = 10000;

  for (let i = 0; i <= total; i += 1000) {
    bar.update(i, total, {
      pi: (tokens: ProgressBarTokens) => Math.PI * tokens.current,
    });
    await delay();
  }

  bar.finish();
}

async function main(): Promise<void> {
  await testRenderDefaults();
  await testLog();
  await testFunctionToken();
}

async function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().then(undefined, console.error);
