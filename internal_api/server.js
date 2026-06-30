const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

// Publicly accessible endpoint (internal to docker network)
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', service: 'SecureTrust Internal API' });
});

// Highly sensitive endpoint
app.get('/v1/secret-vault', (req, res) => {
  res.json({
    warning: 'CONFIDENTIAL',
    message: 'This endpoint is restricted to internal network traffic only.',
    data: {
      vault_status: 'locked',
      master_key: 'FLAG{SSRF_M4ST3R_H4CK3R}'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Internal API running on port ${PORT}`);
});
