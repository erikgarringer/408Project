# Deploying with Docker

This directory contains instructions and scripts for deploying the Node.js
application to an AWS EC2 instance using Docker containers. This method
simplifies the deployment process by encapsulating the application and its
dependencies within Docker containers, making it easier to manage and scale.

The deployment process uses the `dev.sh` script to automate common tasks such as
building Docker images, pushing them to Docker Hub, and deploying them to the EC2
instance.

## Prerequisites

Before you begin, ensure complete the following steps:

- [Install Docker](https://docs.docker.com/get-docker/)
- Create a free account on [Docker Hub](https://hub.docker.com/)
- Create a [Personal Access Token](https://docs.docker.com/docker-hub/access-tokens/)

## Step 1: Create an AWS EC2 Instance

- [Launch an EC2 Instance](EC2launch/README.md)
- [SSH into your EC2 Instance](EC2ssh/README.md)

## Step 2: Create a new .env File

Before you configure your project make sure you have following:

- Your Docker Hub username
- Your Docker Hub Personal Access Token
- Your AWS EC2 **Public DNS** which you can find in the AWS EC2 Management Console
![EC2 Public DNS](EC2_public_dns.png)
- Your AWS EC2 SSH Key File (.pem) which you downloaded when creating your EC2 instance
- Copy your AWS EC2 SSH Key File (.pem) to your home `~/.ssh/` directory


**IMPORTANT:** NEVER commit your `.pem` file to version
control. It should be ignored by your `.gitignore` file. If you accidentally
commit it, immediately delete the file from your repository, terminate your
EC2 instance and email your instructor to let them know your credentials may
have been compromised so they can make check to ensure your instance is secure.

Create a new configuration:
```bash
./dev.sh new
```

Initialize your project:
```bash
./dev.sh init
```

## Step 3: Validate your Configuration

Run the following command to validate your configuration:
```bash
./dev.sh login
```

If the validation is successful, you should see something like this:

```
✔ .env file found.
Authenticating Docker Hub credentials...
✔ Docker Hub authentication successful.
Validating EC2 connection...
✔ EC2 connection successful.
Checking other environment variables...
APP_NAME: full-stack-web-app
APP_VERSION: latest
EC2_DEPLOY_DIR: /home/ubuntu/full-stack-web-app
✔ All required environment variables are set.
```
If there are any issues with your configuration, the output will indicate what
needs to be fixed.

## Step 4: Run the Application

Make sure your project builds and runs locally before deploying to production.
Start the Docker Compose services in production mode:

```bash
./dev.sh up
```

You should see output indicating that the services are starting up. Test the
application locally by navigating to the URL that was output in your terminal,
and ensure everything is working as expected. Make sure to test any database
functionality as well.

## Step 5: Build Docker Images and Push to Docker Hub

Once you have confirmed that the application is working correctly locally, build and
push the Docker images to Docker Hub:

```bash
./dev.sh build
./dev.sh push
```

## Step 6: Deploy to AWS EC2

Finally, deploy the application to your AWS EC2 instance:

```bash
./dev.sh deploy
```
You should see output indicating that the deployment is in progress. Once the
deployment is complete, you can access your application using the Public DNS of
your EC2 instance in your web browser.

## Viewing Logs

To view real-time logs from your EC2 instance:

```bash
./dev.sh logs
```

You should see the logs from your Docker containers streaming in your terminal.
This is useful for monitoring the application and debugging any issues that may
arise.

## SSH into your EC2 Instance

To SSH into your EC2 instance, use the following command:

```bash
./dev.sh ssh
```