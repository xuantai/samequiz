import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const config = {
  host: '36.50.177.253',
  port: 22,
  username: 'root',
  password: 'MatKhauDay123',
  readyTimeout: 30000
};

const runRemoteCommand = (conn, cmd) => {
  return new Promise((resolve, reject) => {
    console.log(`\n?? [VPS] > ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code, signal) => {
        if (code !== 0 && !cmd.includes('pm2 delete') && !cmd.includes('which pm2') && !cmd.includes('which node')) {
          console.warn(`?? Command exited with code ${code}`);
        }
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

const uploadFile = (conn, localPath, remotePath) => {
  return new Promise((resolve, reject) => {
    console.log(`?? Uploading ${localPath} -> ${remotePath}...`);
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => {
        console.log(`? Upload complete!`);
        resolve();
      });
      writeStream.on('error', (err) => reject(err));
      readStream.pipe(writeStream);
    });
  });
};

async function deploy() {
  console.log('?? Connecting to VPS 36.50.177.253...');
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('?? SSH Connection established successfully!\n');

    try {
      // 1. Check OS
      await runRemoteCommand(conn, 'uname -a && cat /etc/os-release | grep PRETTY_NAME');

      // 2. Ensure Node.js & Nginx are installed
      console.log('\n?? Checking / Installing Node.js, Nginx, PM2...');
      const checkNode = await runRemoteCommand(conn, 'which node || echo "NOT_FOUND"');
      if (checkNode.stdout.includes('NOT_FOUND')) {
        console.log('?? Installing Node.js 20.x and Nginx...');
        await runRemoteCommand(conn, 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get update && apt-get install -y nodejs nginx git tar');
      }

      // Check PM2
      const checkPm2 = await runRemoteCommand(conn, 'which pm2 || echo "NOT_FOUND"');
      if (checkPm2.stdout.includes('NOT_FOUND')) {
        console.log('?? Installing PM2 globally...');
        await runRemoteCommand(conn, 'npm install -g pm2');
      }

      // 3. Upload deploy package
      const archiveLocal = path.join(process.cwd(), 'deploy.tar.gz');
      await uploadFile(conn, archiveLocal, '/tmp/samequiz_deploy.tar.gz');

      // 4. Extract into /var/www/samequiz
      await runRemoteCommand(conn, 'mkdir -p /var/www/samequiz && tar -xzf /tmp/samequiz_deploy.tar.gz -C /var/www/samequiz');

      // 5. Install dependencies on VPS
      await runRemoteCommand(conn, 'cd /var/www/samequiz && npm install --omit=dev');

      // 6. Configure PM2 process
      await runRemoteCommand(conn, 'cd /var/www/samequiz && pm2 delete samequiz 2>/dev/null || true');
      await runRemoteCommand(conn, 'cd /var/www/samequiz && pm2 start server/index.js --name samequiz');
      await runRemoteCommand(conn, 'pm2 save');

      // 7. Setup Nginx VirtualHost
      await runRemoteCommand(conn, `cat << 'EOF' > /etc/nginx/sites-available/samequiz.com
server {
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
EOF`);

      await runRemoteCommand(conn, 'ln -sf /etc/nginx/sites-available/samequiz.com /etc/nginx/sites-enabled/samequiz.com');
      await runRemoteCommand(conn, 'rm -f /etc/nginx/sites-enabled/default');
      await runRemoteCommand(conn, 'nginx -t && (systemctl reload nginx || systemctl restart nginx)');

      // 8. Health Check
      console.log('\n?? Performing Health Checks...');
      await runRemoteCommand(conn, 'curl -I http://127.0.0.1:3001');
      await runRemoteCommand(conn, 'pm2 list');

      console.log('\n============================================================');
      console.log('? TRI?N KHAI HOÀN T?T THÀNH CÔNG! ?');
      console.log('?? Web Application: http://samequiz.com ho?c http://36.50.177.253');
      console.log('?? Admin Master Portal: http://samequiz.com/master');
      console.log('============================================================\n');

    } catch (err) {
      console.error('? Error during deployment:', err);
    } finally {
      conn.end();
    }
  });

  conn.on('error', (err) => {
    console.error('? SSH Connection Error:', err);
  });

  conn.connect(config);
}

deploy();
