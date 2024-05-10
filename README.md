# CTE Certificates

### Local Development:

# CTE Web Admin

## Project Overview

The CTE Web Admin is a web-based application designed to facilitate the process of determining, distributing, and tracking educational certificates for students and administrators. It provides a platform where students can log in to select courses and track their certification progress, and where administrators can manage and export student data.

### Features

- **Student Interface:** Upon logging in, students can select courses, view previous certificates, and track their progress towards new certifications.
- **Administrator Interface:** Features an export page for downloading student data into a spreadsheet, accessible only to administrators.

## Platform Requirements

This application is browser-based and platform-independent.

## Installation Instructions

1. Follow the [Software Engineering Toolchain Setup](https://docs.google.com/document/d/1wvdn-MVotuBM6wehNdPpbbOFMzmKLPxFzErH8-mkP1s/preview?pli=1#heading=h.ja24rkqe39ln).
2. Clone the repository from GitHub:
   ```bash
   git clone <repository-url>
   ```
3. Create a `.env` file in the project root and ask Mr. Schmit for the `PORT` number and `MONGO_URI`. Example:
   ```
   PORT=8081
   MONGO_URI=mongodb+srv://nnhssoftware:V7VpG7976lbE2Hh8@cluster0.k7wkeh2.mongodb.net/students?retryWrites=true&w=majority
   ```
4. Configure `launch.json` to match the `PORT` in your `.env` file.

## Running the Application

1. Open Visual Studio Code.
2. Navigate to the 'Run and Debug' sidebar.
3. From the dropdown menu, select 'Node Server' and click the green play button to start the server.
4. Repeat the process for 'Node Client'.
5. If installed, Google Chrome will launch and open `http://localhost:8081`.
6. You should see the CTE Web Admin website interface.

## Project Architecture

### Model

Located in `server/model`, `cte.json` and `model.js` manage data schemas and database interactions.

### View

The view layer, consisting of EJS templates in `server/views` and root views, generates dynamic HTML content for the user interface.

### Controller

Data processing and routing are handled in `server/routes` through `router.js`.

### Configuration and Setup

Essential configurations are managed in `server.js`, `.env`, and `package.json`.

### Static Assets

Static files like images and scripts are stored in the `assets` folder.

## Data Schema

- **MongoDB Student Schema:**
  - `sub`: Unique identifier for each student.
  - `email`: Student's email address.
  - `given_name` and `family_name`: Student's first and last names.
  - `courses`: Array of courses taken by the student.
  - `certificates`: Array of certificates earned or eligible for.

## User Stories (Product Backlog)

- (10) As a student, I want to filter courses based on criteria such as grade, interest, etc.
- (8) As a CTE admin, I want to self-host the website to reduce costs and increase control.
- (4) As a student, I want a centralized application for all CTE-related activities.
- (5) As a teacher, I need an easier way to update the 'Student of the Month' feature.
- (7) As a student, I want an easier way to find CTE courses, possibly through a recommendation survey.
- (3) Fix collapsible menu issue on the course selection page.
- (5) As an administrator, I want to export only current year's data for students.

## Known Issues

Currently, there are no known issues.

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
12. Update the .env file:

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
