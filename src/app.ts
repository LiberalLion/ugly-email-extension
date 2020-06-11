import Gmailjs from '../vendor/gmail-js';
import * as gmail from './utils/dom';
import * as database from './utils/database';
import indexedDB from './services/indexeddb';
import trackers from './services/trackers';
import worker from './services/worker';

(async () => {
  await Promise.all([
    indexedDB.init(),
    trackers.init(),
    worker.init(),
  ]);

  const currentVersion = await database.getCurrentVersion();

  // first time setup
  if (!currentVersion) {
    await database.setup(trackers.version);
  } else if (currentVersion !== trackers.version) {
    await Promise.all([
      database.upgrade(trackers.version),
      database.upgrade(trackers.version),
    ]);
  }

  /**
   * Runs every 2500ms
   */
  let timer: NodeJS.Timeout;

  async function observe() {
    clearTimeout(timer);

    if (Gmailjs.check.is_inside_email()) {
      await gmail.checkThread();
    } else {
      await gmail.checkList();
    }

    timer = setTimeout(observe, 2500);
  }

  Gmailjs.observe.on('load', observe);
})();
