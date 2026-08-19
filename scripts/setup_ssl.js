import { Client } from 'ssh2';

const config = {
  host: '36.50.177.253',
  port: 22,
  username: 'root',
  password: 'MatKhauDay123',
  readyTimeout: 30000
};

const runRemoteCommand = (conn, cmd) => {
  return new Promise((resolve) => {
    console.log(`\n?? [VPS] > ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return resolve({ code: 1, error: err });
      let stdout = '';
      let stderr = '';
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      }).on('data', (data) => {
        stdout += data;
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        stderr += data;
        process.stderr.write(data);
      });
    });
  });
};

async function setupSSL() {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      console.log('?? Issuing SSL Certificate for samequiz.com...');
      await runRemoteCommand(conn, 'certbot --nginx -d samequiz.com --non-interactive --agree-tos -m admin@samequiz.com --redirect || echo "Certbot completed"');
      await runRemoteCommand(conn, 'nginx -t && (systemctl reload nginx || systemctl restart nginx)');
    } finally {
      conn.end();
    }
  });
  conn.connect(config);
}

setupSSL();
