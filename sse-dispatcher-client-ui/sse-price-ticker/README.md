# Real-time Price Ticker

This project is a real-time price ticker application built with React for the frontend and Spring Boot for the backend. It displays live pricing data for various currency pairs and allows users to start and pause pricing for individual or all currency pairs.

## Features

- **Real-time Price Updates**: Displays live bid and ask prices for currency pairs.
- **Start/Pause Pricing**: Start or pause pricing for individual currency pairs or all pairs at once.
- **User Subscription**: Users can subscribe to receive real-time updates.
- **Reconnect**: Option to reconnect if the connection is lost.
- **Historical Data**: Displays historical price data in bar charts.

## Technologies Used

- **Frontend**: React, Material-UI, Axios, Chart.js, AG Grid
- **Backend**: Spring Boot, SSE (Server-Sent Events)
- **Build Tools**: Maven (for backend), npm (for frontend)

## Getting Started

### Prerequisites

- Node.js and npm
- Java 11+
- Maven

### Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/your-repo/real-time-price-ticker.git
    cd real-time-price-ticker
    ```

2. **Backend Setup**:
    ```sh
    cd ss-dispatcher-server
    mvn clean install
    mvn spring-boot:run
    ```

3. **Frontend Setup**:
    ```sh
    cd ../sse-dispatcher-client-ui
    npm install
    npm start
    ```

### Running the Application

1. **Start the backend server**:
    ```sh
    cd ss-dispatcher-server
    mvn spring-boot:run
    ```

2. **Start the frontend application**:
    ```sh
    cd ../sse-dispatcher-client-ui
    npm start
    ```

3. **Open your browser** and navigate to `http://localhost:3000`.

## API Endpoints

### Backend Endpoints

- **Start Pricing for a Currency Pair**: `/startPricing?ccyPair={ccyPair}`
- **Pause Pricing for a Currency Pair**: `/pausePricing?ccyPair={ccyPair}`
- **Start Pricing for All Pairs**: `/startAllPricing`
- **Pause Pricing for All Pairs**: `/pauseAllPricing`
- **Get Pricing State**: `/pricingState`

## Components

### `PriceTicker.js`

- **User Subscription**: Allows users to enter a username and subscribe to real-time updates.
- **Start/Pause Buttons**: Buttons to start or pause pricing for individual or all currency pairs.
- **Price Grid**: Displays the current bid and ask prices for each currency pair.
- **Historical Data Charts**: Displays historical price data in bar charts.



## Notes

- Ensure that the backend server is running before starting the frontend application.
- The application uses Server-Sent Events (SSE) for real-time updates.
- The frontend application is built with React and uses Material-UI for styling and AG Grid for displaying data.


npm install electron --save-dev

npm install concurrently wait-on --save-dev