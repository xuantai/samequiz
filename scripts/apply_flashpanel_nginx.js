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

async function fixNginx() {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      console.log('?? Updating samequiz.com.conf with both port 80 and port 443...');
      const siteConfig = `server {
  listen 80;
  listen [::]:80;
  server_name samequiz.com www.samequiz.com 36.50.177.253;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_ssl_server_name on;
    proxy_ssl_name $host;
    proxy_pass_request_headers on;
  }
}

server {
  listen 443 quic;
  listen 443 ssl;
  listen [::]:443 quic;
  listen [::]:443 ssl;
  http2 on;
  http3 off;

  ssl_certificate /etc/letsencrypt/live/samequiz.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/samequiz.com/privkey.pem;

  server_name samequiz.com www.samequiz.com;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_ssl_server_name on;
    proxy_ssl_name $host;
    proxy_pass_request_headers on;
  }
}`;

      await runRemoteCommand(conn, `cat << 'EOF' > /etc/nginx/sites-enabled/samequiz.com.conf
${siteConfig}
EOF`);

      await runRemoteCommand(conn, 'nginx -t && (systemctl reload nginx || systemctl restart nginx)');

      console.log('\n?? Testing HTTP Port 80...');
      await runRemoteCommand(conn, 'curl -I -H "Host: samequiz.com" http://127.0.0.1');

      console.log('\n?? Testing HTTPS Port 443...');
      await runRemoteCommand(conn, 'curl -k -I --resolve samequiz.com:443:127.0.0.1 https://samequiz.com');

    } finally {
      conn.end();
    }
  });
  conn.connect(config);
}

fixNginx();
