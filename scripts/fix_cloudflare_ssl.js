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

async function fixCloudflare() {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      console.log('?? Setting separate HTTP 80 and HTTPS 443 server blocks in Nginx...');
      
      const nginxConfig = `server {
    listen 80;
    listen [::]:80;
    server_name samequiz.com www.samequiz.com 36.50.177.253;

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

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name samequiz.com www.samequiz.com;

    ssl_certificate /etc/letsencrypt/live/samequiz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/samequiz.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

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
}`;

      await runRemoteCommand(conn, `cat << 'EOF' > /etc/nginx/sites-available/samequiz.com
${nginxConfig}
EOF`);

      await runRemoteCommand(conn, 'ln -sf /etc/nginx/sites-available/samequiz.com /etc/nginx/sites-enabled/samequiz.com');
      await runRemoteCommand(conn, 'nginx -t && (systemctl reload nginx || systemctl restart nginx)');
      
      console.log('\n?? Testing HTTP Port 80...');
      await runRemoteCommand(conn, 'curl -I -H "Host: samequiz.com" http://127.0.0.1');

      console.log('\n?? Testing HTTPS Port 443 with SNI...');
      await runRemoteCommand(conn, 'curl -k -I --resolve samequiz.com:443:127.0.0.1 https://samequiz.com');
      
    } finally {
      conn.end();
    }
  });
  conn.connect(config);
}

fixCloudflare();
