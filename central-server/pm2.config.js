module.exports = {
  apps: [
    {
      name: "central-server",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 7000
      }
    }
  ]
};