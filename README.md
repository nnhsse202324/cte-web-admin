# CTE Certificates

### Local Development:



### Production Server Deployment
1. Create a new EC2 instance used on Ubuntu.
2. Open ports for HTTP and HTTPS when walking through the EC2 wizard.
3. Generate a key pair for this EC2 instance. Download and save the private key, which is needed to connect to the instance in the future.
4. After the EC2 instance is running, click on the Connect button the EC2 Management Console for instructions on how to ssh into the instance.
5. On the EC2 instance, [install](https://github.com/nodesource/distributions/blob/master/README.md) Node.js v18

```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
```

6. On the EC2 instance, install nginx: `sudo apt-get -y install nginx`
7. Create a reverse proxy for the CTE Certificates node server. In the file /etc/nginx/sites-enabled/ctecertificates:

```
server {
	# listen on port 80 (http)
	listen 80;
	server_name ctecertificates.nnhsse.org;

	# write access and error logs to /var/log
	access_log /var/log/ctecertificates_access.log;
	error_log /var/log/ctecertificates_error.log;

	location / {
		# forward application requests to the node server
		proxy_pass http://localhost:8081;
		proxy_redirect off;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}
}
```

8. Restart the nginx server: `sudo service nginx reload`
9. Install and configure [certbot](https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal)
10. Clone this repository from GitHub.
11. Inside of the directory for this repository install the node dependencies: `npm install`
15. Update the .env file:

```
PORT=8081
MONGO_URI=mongodb+srv://nnhssoftware:<password>@<cluster>.mongodb.net/students?retryWrites=true&w=majority
```

16. Update Google Cloud Platform is allow connections from new domain (ctecertificates.nnhsse.org)
17. Install Production Manager 2, which is used to keep the node server running and restart it when changes are pushed to master:

```
sudo npm install pm2 -g
sudo pm2 --name ctecertificates start "npm run start"
sudo pm2 restart ctecertificates --watch
```

18. Verify that the node server is running: `sudo pm2 list`
19. Configure pm2 to automatically run when the EC2 instance restarts: `sudo pm2 startup`
20. Add a crontab entry to pull from GitHub every 15 minutes: `crontab -e`

```
*/15 * * * * cd /home/ubuntu/cte-certificates && git pull
```

21. Restart the node server: `sudo pm2 restart <app id>`
