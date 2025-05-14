# DelegateEase

A self-hosted web application for easily managing Gmail delegation access for your organization. DelegateEase is a powerful web application designed to streamline the process of managing Gmail delegate access. It provides a user-friendly interface for administrators to efficiently handle email delegation across multiple accounts.

## Features

- **Multiple Authentication Methods**
  - Service Account Authentication
  - OAuth 2.0 Authentication
  - Secure credential management

- **Delegate Management**
  - Add delegates to Gmail accounts
  - Remove delegate access
  - List existing delegates
  - Batch operations support

- **User-Friendly Interface**
  - Clean, modern UI built with Next.js
  - Intuitive form-based operations
  - Real-time feedback and status updates
  - Responsive design for all devices

- **Security**
  - Secure credential handling
  - Environment-based configuration
  - Protected API endpoints
  - Safe file upload handling

## Tech Stack

- **Frontend**
  - Next.js 14
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components

- **Backend**
  - Node.js
  - Gmail API Integration
  - TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Google Cloud Platform account
- Gmail API enabled
- Service account credentials (for service account authentication)

### Google Cloud Setup

#### 1. Create a Google Cloud Project and Service Account

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

#### 2. Configure Domain-Wide Delegation

1. Go to your Google Workspace Admin Console
2. Navigate to Security > API Controls > Domain-wide Delegation
3. Click "Add new" and enter:
   - Client ID: Your service account's client ID (found in the JSON key file)
   - OAuth Scopes:
     ```
     https://www.googleapis.com/auth/gmail.settings.sharing,
     https://www.googleapis.com/auth/gmail.settings.basic,
     https://www.googleapis.com/auth/gmail.modify
     ```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Arunnpuram/DelegateEase.git
   cd DelegateEase
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your_client_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Authentication**
   - Choose between Service Account or OAuth 2.0 authentication
   - Follow the on-screen instructions to complete authentication

2. **Managing Delegates**
   - Select the operation type (Add/Remove/List)
   - Enter the primary user's email
   - Enter delegate email(s)
   - Submit the request

3. **Batch Operations**
   - Use the batch operations feature for managing multiple delegates
   - Follow the format instructions in the interface

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- Google Gmail API
- Next.js team
- Shadcn UI
- All contributors and users of the project
