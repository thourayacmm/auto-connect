const http = require("http");
const mongoose = require("mongoose");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const { app } = require("./app");

const listenOnPort = (port) =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);

    const handleError = (error) => {
      server.removeListener("listening", handleListening);
      reject(error);
    };

    const handleListening = () => {
      server.removeListener("error", handleError);
      resolve(server);
    };

    server.once("error", handleError);
    server.once("listening", handleListening);
    server.listen(port);
  });

const startHttpServer = async (preferredPort, retryCount) => {
  let lastError = null;

  for (let offset = 0; offset < retryCount; offset += 1) {
    const candidatePort = preferredPort + offset;

    try {
      const server = await listenOnPort(candidatePort);
      return { server, port: candidatePort, usedFallback: offset > 0 };
    } catch (error) {
      if (error.code !== "EADDRINUSE") {
        throw error;
      }

      lastError = error;
      // eslint-disable-next-line no-console
      console.warn(`Port ${candidatePort} is already in use. Trying the next port...`);
    }
  }

  throw lastError || new Error("No available port found");
};

const registerShutdownHandlers = (server) => {
  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received. Shutting down AUTO CONNECT backend...`);

    server.close(async () => {
      try {
        await mongoose.connection.close();
        // eslint-disable-next-line no-console
        console.log("HTTP server and MongoDB connection closed");
        process.exit(0);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error while closing resources", error);
        process.exit(1);
      }
    });
  };

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
      shutdown(signal);
    });
  });
};

const startServer = async () => {
  try {
    await connectDb();
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");

    const { server, port, usedFallback } = await startHttpServer(env.port, env.portRetryCount);

    if (usedFallback) {
      // eslint-disable-next-line no-console
      console.log(`Preferred port ${env.port} was busy. AUTO CONNECT backend running on port ${port}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`AUTO CONNECT backend running on port ${port}`);
    }

    registerShutdownHandlers(server);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
