
# India Post - AI Grievance Redressal System

## Deployment to Vercel

To deploy this application to Vercel, follow these steps:

1. **Push to a Git Provider**: Upload your code to GitHub, GitLab, or Bitbucket.
2. **Connect to Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New** > **Project**.
   - Import your repository.
3. **Build Settings**:
   - Vercel should automatically detect **Vite** as the framework.
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Important: This app requires a Google Gemini API key.
   - In the **Environment Variables** section of the Vercel deployment settings, add:
     - **Key**: `API_KEY`
     - **Value**: `[Your-Gemini-API-Key]`
5. **Deploy**: Click the **Deploy** button.

## Local Configuration
If you want to run this locally:
1. `npm install`
2. Create a `.env` file in the root.
3. Add `VITE_API_KEY=your_key_here`.
4. Update `vite.config.ts` to use `VITE_API_KEY` or ensure your environment has `API_KEY` set.

## Features
- **AI Triage**: Automatically classifies complaints and assesses priority.
- **Logistics Audit**: Generates a technical hypothesis for delivery delays.
- **Live Voice**: Real-time native audio interface for citizens.
- **Supervisor Dashboard**: High-density analytics for department staff.
