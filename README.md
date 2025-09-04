# Detroit Tigers Roster App

A modern web application that displays the Detroit Tigers roster for any day of the season using public MLB APIs.

## Features

- **Historical Roster View**: View the active Detroit Tigers roster for any date during the 2025 season
- **Date Selection**: Interactive date picker to select specific roster dates
- **Player Information**: Detailed player cards showing:
  - Jersey number, name, and age
  - Position and status
  - Batting/throwing preferences
  - Physical stats (height, weight)
  - Birthplace and date
- **Position Grouping**: Players organized by position (Pitchers, Catchers, Infielders, Outfielders)
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: MLB Stats API (public API)
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Tigers
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## API Information

This application uses the public MLB Stats API (https://statsapi.mlb.com) to fetch:
- Team rosters for specific dates
- Player details and statistics
- Team information

No API key is required as this uses publicly available endpoints.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Main roster page
│   └── globals.css         # Global styles
├── components/
│   ├── DateSelector.tsx    # Date picker component
│   └── PlayerCard.tsx      # Individual player card
├── services/
│   └── mlbApi.ts          # MLB API service functions
└── types/
    └── player.ts          # TypeScript type definitions
```

## Usage

1. **Select a Date**: Use the date picker to choose any date during the 2025 MLB season
2. **View Roster**: The app will automatically fetch and display the active roster for that date
3. **Explore Players**: Browse player cards organized by position groups
4. **Player Details**: Each card shows comprehensive player information

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **DateSelector**: Interactive date picker with validation for MLB season dates
- **PlayerCard**: Displays individual player information with position-based color coding
- **MLBApiService**: Handles all API communications with proper error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is for educational purposes. Player data is provided by MLB Stats API.

## Acknowledgments

- MLB Stats API for providing free access to baseball data
- Detroit Tigers organization
- Next.js and Tailwind CSS teams for excellent developer tools

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
