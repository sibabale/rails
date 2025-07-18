const cluster = require('cluster');
const os = require('os');

const { posthogClient } = require('./src/posthog/posthog.js');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master process ${process.pid} is running. Forking ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new worker...`);
    posthogClient.capture({
      distinctId: 'system',
      event: 'worker_restarted',
      properties: {
        worker_pid: worker.process.pid,
        code,
        signal
      }
    });
    cluster.fork();
  });
} else {
  const express = require("express");
  const bodyParser = require("body-parser");
  const { postTransaction } = require("./src/ledger/ledger");
  const { addToQueue, processQueue } = require("./src/queue/queue");
  const routes = require("./src/routes");

  const app = express();
  app.use(bodyParser.json());

  // Global API tracking middleware
  app.use(async (req, res, next) => {
    const start = Date.now();
    const cleanup = () => {
      res.removeListener('finish', cleanup);
      res.removeListener('close', cleanup);
      const duration = Date.now() - start;
      const userId = req.body && req.body.userId ? req.body.userId : 'anonymous';
      posthogClient.capture({
        distinctId: userId,
        event: 'api_call',
        properties: {
          endpoint: req.originalUrl,
          method: req.method,
          status: res.statusCode,
          duration_ms: duration
        }
      });
      if (res.statusCode >= 400) {
        posthogClient.capture({
          distinctId: userId,
          event: 'api_error',
          properties: {
            endpoint: req.originalUrl,
            method: req.method,
            status: res.statusCode
          }
        });
      }
    };
    res.on('finish', cleanup);
    res.on('close', cleanup);
    next();
  });

  routes.forEach(router => app.use("/api", router));

  // Background processing loop
  processQueue(postTransaction);

  process.on('SIGINT', async () => {
    await posthogClient.shutdown();
    process.exit();
  });

  const PORT = 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} running on http://localhost:${PORT}`);
  });
}