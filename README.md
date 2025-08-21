# GPX snippets

Little utilities for working with GPX

## Features

- Upload and visualize GPX traces on an interactive map
- Calculate and display track statistics
- Select two points on a GPX trace and interpolate a route between them
- Choose between different routing providers:
  - OpenStreetMap Routing Machine (OSRM) - client-side, no API key needed
  - OpenRouteService (ORS) - server-side, requires API key

## Setup

1. Copy the `.env.example` file to `.env`
2. If you want to use OpenRouteService:
   - Sign up at [OpenRouteService](https://openrouteservice.org/) to get an API key
   - Add your API key to the `.env` file

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```