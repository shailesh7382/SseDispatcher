import React, {useEffect, useState, useRef} from 'react';
import {Container, Typography, Alert, TextField, Button, FormHelperText, CircularProgress, Paper} from '@mui/material';
import {makeStyles} from '@mui/styles';
import 'bootstrap/dist/css/bootstrap.min.css';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import config from './config';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Define custom styles using Material-UI's makeStyles
const useStyles = makeStyles(() => ({
    helperText: {
        fontSize: '0.75rem',
        marginLeft: '8px',
    },
    positive: {
        backgroundColor: 'lightgreen',
    },
    negative: {
        backgroundColor: 'lightcoral',
    },
    notesPanel: {
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#f5f5f5',
        color: '#666',
    },
    reconnectRow: {
        backgroundColor: 'lightyellow',
        padding: '8px',
        marginTop: '16px',
        textAlign: 'center',
    },
    spinner: {
        marginLeft: '8px',
    },
    buttonContainer: {
        marginTop: '16px', // Push the button panel down
    },
    button: {
        marginRight: '8px', // Add space between buttons
    },
    icon: {
        verticalAlign: 'middle',
    },
}));

const PriceTicker = () => {
    const classes = useStyles();
    const [prices, setPrices] = useState({});
    const [prevPrices, setPrevPrices] = useState({});
    const [error, setError] = useState('');
    const [userId, setUserId] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [connectionClosed, setConnectionClosed] = useState(false);
    const [ticks, setTicks] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const eventSourceRef = useRef(null);

    // Helper function to create a delay
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Function to create and manage the EventSource connection
    const createEventSource = async () => {
        const eventSource = new EventSource(`${config.sseUrl}?userId=${userId}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('Connection to SSE opened.');
            setConnectionClosed(false);
            setStartTime(Date.now());
            setTicks(0);
            setReconnectAttempts(0); // Reset reconnection attempts on successful connection
            setIsReconnecting(false);
        };

        eventSource.onmessage = (event) => {
            console.log('Received event:', event.data);
            try {
                const data = JSON.parse(event.data);
                if (data.error) {
                    setError(data.message);
                } else {
                    const {bid, ask, ccyPair} = data;
                    console.log(`Parsed bid: ${bid}, ask: ${ask}, ccyPair: ${ccyPair}`);

                    setPrevPrices((prev) => {
                        const newPrevPrices = {...prev};
                        newPrevPrices[ccyPair] = prices[ccyPair] || {bid: 0, ask: 0};
                        return newPrevPrices;
                    });

                    setPrices((prev) => ({
                        ...prev,
                        [ccyPair]: {bid, ask}
                    }));

                    console.log('Previous prices:', prevPrices);
                    console.log('current prices:', prices);
                    setTicks((prevTicks) => prevTicks + 1);
                }
            } catch (e) {
                console.error('Failed to parse event data:', e);
            }
        };

        eventSource.onerror = async (err) => {
            console.error('EventSource failed -> ', err);
            try {
                const errorData = JSON.parse(err.data);
                console.error('error :', errorData);
                setError(errorData.message || 'EventSource failed.');
            } catch (e) {
                setError('EventSource failed: ' + err);
            }
            setConnectionClosed(true);
            eventSource.close();
            eventSourceRef.current = null;

            if (reconnectAttempts < config.maxReconnectAttempts) {
                setIsReconnecting(true);
                const delayTime = Math.pow(2, reconnectAttempts) * config.reconnectBaseDelay; // Exponential backoff
                await delay(delayTime);
                setReconnectAttempts(reconnectAttempts + 1);
                createEventSource();
            } else {
                setError('Maximum reconnection attempts reached.');
                setIsReconnecting(false);
            }
        };
    };

    // Function to handle subscription to price updates
    const handleSubscribe = () => {
        if (userId.trim() !== '') {
            setSubscribed(true);
            createEventSource();
        }
    };

    // Calculate elapsed time and ticks per second
    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
    const ticksPerSecond = (ticks / elapsedTime).toFixed(2);

    // Cleanup EventSource on component unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Define columns for ag-Grid
    const columns = [
        {headerName: 'Currency Pair', field: 'ccyPair'},
        {
            headerName: 'Bid',
            field: 'bid',
            cellClass: (params) => getCardClass(params.value, prevPrices[params.data.ccyPair]?.bid)
        },
        {
            headerName: 'Ask',
            field: 'ask',
            cellClass: (params) => getCardClass(params.value, prevPrices[params.data.ccyPair]?.ask)
        },
        {headerName: 'Change', field: 'change', cellRenderer: 'changeRenderer'},
    ];

    // Prepare row data for ag-Grid
    const rowData = Object.keys(prices).map((ccyPair) => ({
        ccyPair,
        bid: prices[ccyPair].bid.toFixed(4),
        ask: prices[ccyPair].ask.toFixed(4),
        change: prices[ccyPair].bid - (prevPrices[ccyPair]?.bid || 0),
    }));

    // Function to determine the CSS class for price cells
    const getCardClass = (current, previous) => {
        if (current > previous) return classes.positive;
        if (current < previous) return classes.negative;
        return '';
    };

    // Custom cell renderer for change column
    const ChangeRenderer = (props) => {
        const change = props.value;
        return (
            <span>
                {change > 0 ? <ArrowUpwardIcon className={classes.icon}/> :
                    <ArrowDownwardIcon className={classes.icon}/>}
            </span>
        );
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom className="font-weight-bold">
                Real-time Price Ticker
            </Typography>
            <TextField
                label="User Name"
                variant="outlined"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                fullWidth
                margin="normal"
                error={userId.trim() === ''}
                InputLabelProps={{className: 'font-weight-bold'}}
                InputProps={{className: 'font-weight-bold'}}
            />
            {userId.trim() === '' && (
                <FormHelperText className={`${classes.helperText} font-weight-bold`} error>
                    User name is required
                </FormHelperText>
            )}
            <div className={classes.buttonContainer}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubscribe}
                    disabled={subscribed || userId.trim() === ''}
                    className={`${classes.button} font-weight-bold`}
                >
                    Subscribe
                </Button>
                {connectionClosed && (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={createEventSource}
                        className={`${classes.button} font-weight-bold`}
                    >
                        Reconnect
                        {isReconnecting && <CircularProgress size={20} className={classes.spinner}/>}
                    </Button>
                )}
            </div>
            <div className="ag-theme-alpine" style={{height: 400, width: '100%'}}>
                <AgGridReact
                    columnDefs={columns}
                    rowData={rowData}
                    frameworkComponents={{changeRenderer: ChangeRenderer}}
                />
            </div>
            {error && <Alert severity="error" className="font-weight-bold">{error}</Alert>}
            <Typography variant="body1" className="font-weight-bold">User: {userId}</Typography>
            <Paper className={`${classes.notesPanel} font-weight-bold`}>
                <Typography variant="body2">
                    Update Speed: {ticksPerSecond} ticks per second
                </Typography>
            </Paper>
            {connectionClosed && reconnectAttempts < 3 && (
                <div className={classes.reconnectRow}>
                    Attempting to reconnect... ({reconnectAttempts + 1}/3)
                </div>
            )}
        </Container>
    );
};

export default PriceTicker;