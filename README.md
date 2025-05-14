# DelegateEase

A self-hosted web application for easily managing Gmail delegation access for your organization.

## Features

- Add delegate access to shared mailboxes
- Remove delegate access from shared mailboxes
- List all delegates for a mailbox
- Batch operations for multiple mailboxes and delegates
- Secure handling of Google service account credentials
- User-friendly web interface with light and dark mode
- OAuth 2.0 or Service Account authentication options
- Completely self-hosted - no external dependencies

## How It Works

DelegateEase provides a modern web interface for the Gmail delegation management scripts. The core functionality is implemented in:

- `createDelegate.ts` - Script to add delegate access to Gmail accounts
- `deleteDelegate.ts` - Script to remove delegate access from Gmail accounts

The web interface in this repository provides a user-friendly way to use these scripts, with additional features like batch processing and a responsive UI.

## Prerequisites

1. Node.js (v18 or higher)
2. A Google Cloud project with the Gmail API enabled
3. A service account with domain-wide delegation configured (or OAuth 2.0 credentials)

## Setup

### 1. Create a Google Cloud Project and Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and description
   - Grant necessary roles (no specific roles needed for domain-wide delegation)
   - Create and download the JSON key file

### 2. Configure Domain-Wide Delegation

1. Go to your Google Workspace Admin Console
2. Navigate to Security > API Controls > Domain-wide Delegation
3. Click "Add new" and enter:
   - Client ID: Your service account's client ID (found in the JSON key file)
   - OAuth Scopes: 
     https://www.googleapis.com/auth/gmail.settings.sharing,
     https://www.googleapis.com/auth/gmail.settings.basic,
     https://www.googleapis.com/auth/gmail.modify
     
## Self-Hosting Options

### Standard Node.js Deployment

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the application: `npm build`
4. Start the server: `npm start`
5. Access the application at http://localhost:3000

### Docker Deployment

1. Clone the repository
2. Build the Docker image: `docker build -t delegateease .`
3. Run the container: `docker run -p 3000:3000 delegateease`
4. Access the application at http://localhost:3000

### Docker Compose Deployment

1. Clone the repository
2. Run: `docker-compose up -d`
3. Access the application at http://localhost:3000
