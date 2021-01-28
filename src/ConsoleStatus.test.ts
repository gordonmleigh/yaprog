import { ConsoleStatus } from './ConsoleStatus';

const ms = 100;
const total = 60;

(async () => {
  const driver = new ConsoleStatus({ fps: 1 });
  driver.status('this is the status');

  for (let i = 1; i <= total; ++i) {
    await delay(ms);
    driver.progress(i / total, `number ${i}`);

    if (i % 20 === 0) {
      driver.log(`log message ${i}`);
    }
  }

  driver.status(undefined);
})().then(undefined, (err) => console.error(`FATAL: %o`, err));

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
