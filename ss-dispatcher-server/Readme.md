# SSE Dispatcher Server

This project is a Spring Boot application that serves as the backend for a real-time price ticker. It uses Server-Sent Events (SSE) to provide live pricing data for various currency pairs.

## Features

- **Real-time Price Updates**: Provides live bid and ask prices for currency pairs.
- **Start/Pause Pricing**: Start or pause pricing for individual currency pairs or all pairs at once.
- **Pricing State Management**: Keeps track of the pricing state (started/paused) for each currency pair.

## Technologies Used

- **Backend**: Spring Boot, SSE (Server-Sent Events)
- **Build Tools**: Maven

## Getting Started

### Prerequisites

- Java 11+
- Maven

### Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/your-repo/real-time-price-ticker.git
    cd real-time-price-ticker/ss-dispatcher-server
    ```

2. **Build the project**:
    ```sh
    mvn clean install
    ```

3. **Run the application**:
    ```sh
    mvn spring-boot:run
    ```

### API Endpoints

- **Start Pricing for a Currency Pair**: `/startPricing?ccyPair={ccyPair}`
- **Pause Pricing for a Currency Pair**: `/pausePricing?ccyPair={ccyPair}`
- **Start Pricing for All Pairs**: `/startAllPricing`
- **Pause Pricing for All Pairs**: `/pauseAllPricing`
- **Get Pricing State**: `/pricingState`

## Components

### `SseController.java`

Handles HTTP requests related to pricing operations and SSE connections.

#### Key Methods:
- `startPricing(String ccyPair)`: Starts pricing for a specific currency pair.
- `pausePricing(String ccyPair)`: Pauses pricing for a specific currency pair.
- `startAllPricing()`: Starts pricing for all currency pairs.
- `pauseAllPricing()`: Pauses pricing for all currency pairs.
- `getPricingState()`: Returns the current pricing state for all currency pairs.

### `Pricer.java`

Manages the pricing state and provides methods to start and pause pricing.

#### Key Methods:
- `startPricing(String ccyPair)`: Starts pricing for a specific currency pair.
- `pausePricing(String ccyPair)`: Pauses pricing for a specific currency pair.
- `startAllPricing()`: Starts pricing for all currency pairs.
- `pauseAllPricing()`: Pauses pricing for all currency pairs.
- `getPricingState()`: Returns the current pricing state for all currency pairs.

### `BaseDispatcher.java`

Handles the dispatching of pricing updates to clients via SSE.

#### Key Methods:
- `dispatchPriceUpdate(String ccyPair, double bid, double ask)`: Dispatches a price update for a specific currency pair to all connected clients.
- `addClient(SseEmitter emitter)`: Adds a new client to the list of SSE emitters.
- `removeClient(SseEmitter emitter)`: Removes a client from the list of SSE emitters.

## Server-Sent Events (SSE)

SSE is a server push technology enabling a server to push real-time updates to clients over a single HTTP connection.

### Key Features:
- **Unidirectional Communication**: Server to client.
- **Automatic Reconnection**: Clients automatically reconnect if the connection is lost.
- **Simple API**: Easy to implement and use.

### Usage in This Project:
- **Real-time Updates**: Used to send live pricing data to clients.
- **Event Handling**: Clients can handle events using JavaScript's `EventSource` API.
