# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

# Price Ticker

The `PriceTicker` module is a React component that displays real-time EUR/USD price updates using Server-Sent Events (SSE). It includes features for subscribing to price updates, handling reconnection with exponential backoff, and providing UI feedback during reconnection attempts. Below is a detailed description of the module:

### Imports
- **React**: Core library for building the component.
- **Material-UI Components**: Various UI components like `Container`, `Typography`, `Alert`, `TextField`, `Button`, `FormHelperText`, `Card`, `CardContent`, `Grid`, `Paper`, and `CircularProgress`.
- **makeStyles**: A utility from Material-UI for creating custom styles.
- **Bootstrap**: For additional styling.

### Styles
- **useStyles**: A hook that defines custom styles for various elements in the component, such as helper text, positive/negative price changes, cards, notes panel, reconnect row, and spinner.

### State Variables
- **price**: Holds the current bid and ask prices.
- **prevPrice**: Holds the previous bid and ask prices for comparison.
- **error**: Stores any error messages.
- **userId**: Stores the user ID entered by the user.
- **subscribed**: Indicates whether the user is subscribed to price updates.
- **connectionClosed**: Indicates whether the SSE connection is closed.
- **ticks**: Counts the number of price updates received.
- **startTime**: Records the start time of the connection.
- **reconnectAttempts**: Counts the number of reconnection attempts.
- **isReconnecting**: Indicates whether the component is currently attempting to reconnect.

### Helper Functions
- **delay**: Returns a promise that resolves after a specified time, used for implementing exponential backoff.
- **getCardClass**: Determines the CSS class for price cards based on whether the price has increased or decreased.

### Main Functions
- **createEventSource**: Establishes the SSE connection, handles incoming messages, and manages reconnection attempts with exponential backoff.
- **handleSubscribe**: Initiates the subscription to price updates by calling `createEventSource`.

### useEffect Hook
- Ensures that the SSE connection is closed when the component unmounts to prevent memory leaks.

### JSX Structure
- **Container**: Wraps the entire component.
- **Typography**: Displays the title.
- **TextField**: Allows the user to enter their user ID.
- **Button**: Subscribes the user to price updates.
- **Grid**: Displays the bid and ask prices in cards.
- **Alert**: Shows error messages.
- **Paper**: Displays additional information like update speed.
- **Reconnect Button**: Allows the user to manually reconnect if the connection is closed.

#