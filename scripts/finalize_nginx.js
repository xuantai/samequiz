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

async function finalize() {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      console.log('?? Configuring full HTTPS Nginx VirtualHost...');
      await runRemoteCommand(conn, `cat << 'EOF' > /etc/nginx/sites-available/samequiz.com
server {
    listen 80;
    listen [::]:80;
    server_name samequiz.com www.samequiz.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name samequiz.com www.samequiz.com 36.50.177.253;

    ssl_certificate /etc/letsencrypt/live/samequiz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/samequiz.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF`);

      await runRemoteCommand(conn, 'ln -sf /etc/nginx/sites-available/samequiz.com /etc/nginx/sites-enabled/samequiz.com');
      await runRemoteCommand(conn, 'nginx -t && (systemctl reload nginx || systemctl restart nginx)');
      await runRemoteCommand(conn, 'curl -k -I https://127.0.0.1');
    } finally {
      conn.end();
    }
  });
  conn.connect(config);
}

finalize();
