import React, { useEffect, useState, useRef } from 'react';
import { Container, Typography, Alert, TextField, Button, FormHelperText, CircularProgress, Paper, FormControlLabel, Checkbox } from '@mui/material';
import { makeStyles } from '@mui/styles';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import config from './config';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Register the required components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
        marginTop: '16px',
    },
    button: {
        marginRight: '8px',
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
    const [dontReconnect, setDontReconnect] = useState(false);
    const [priceHistory, setPriceHistory] = useState([]);
    const eventSourceRef = useRef(null);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleOpen = () => {
        console.log('Connection to SSE opened.');
        setConnectionClosed(false);
        setStartTime(Date.now());
        setTicks(0);
        setReconnectAttempts(0);
        setIsReconnecting(false);
    };

    const handleMessage = (event) => {
        console.log('Received event:', event.data);
        try {
            const data = JSON.parse(event.data);
            if (data.error) {
                setError(data.message);
            } else {
                const { bid, ask, ccyPair } = data;
                console.log(`Parsed bid: ${bid}, ask: ${ask}, ccyPair: ${ccyPair}`);

                setPrices((prevPrices) => {
                    const prevBid = prevPrices[ccyPair]?.bid;
                    const prevAsk = prevPrices[ccyPair]?.ask;

                    setPrevPrices((prevPrices) => {
                        const newPrevPrices = { ...prevPrices };
                        newPrevPrices[ccyPair] = { bid: prevBid, ask: prevAsk };
                        return newPrevPrices;
                    });

                    return {
                        ...prevPrices,
                        [ccyPair]: { bid, ask }
                    };
                });

                setPriceHistory((prevHistory) => {
                    const newHistory = [...prevHistory, { ccyPair, bid, ask }];
                    if (newHistory.length > 10) newHistory.shift();
                    return newHistory;
                });

                setTicks((prevTicks) => prevTicks + 1);
            }
        } catch (e) {
            console.error('Failed to parse event data:', e);
        }
    };

    const handleError = async (err) => {
        console.error('EventSource failed -> ', err);
        try {
            const errorData = JSON.parse(err.data);
            console.error('error :', errorData);
            setError(errorData.message || 'EventSource failed.');
        } catch (e) {
            setError('EventSource failed: ' + err);
        }
        setConnectionClosed(true);
        eventSourceRef.current.close();
        eventSourceRef.current = null;

        if (!dontReconnect && reconnectAttempts < config.maxReconnectAttempts) {
            setIsReconnecting(true);
            const delayTime = Math.pow(2, reconnectAttempts) * config.reconnectBaseDelay;
            await delay(delayTime);
            setReconnectAttempts(reconnectAttempts + 1);
            createEventSource();
        } else {
            setError('Maximum reconnection attempts reached.');
            setIsReconnecting(false);
        }
    };

    const createEventSource = async () => {
        const eventSource = new EventSource(`${config.sseUrl}?userId=${userId}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = handleOpen;
        eventSource.onmessage = handleMessage;
        eventSource.onerror = handleError;
    };

    const handleSubscribe = () => {
        if (userId.trim() !== '') {
            setSubscribed(true);
            createEventSource();
        }
    };

    useEffect(() => {
        console.log('Previous prices updated:', prevPrices);
        console.log('Current prices updated:', prices);
        console.log('Price history updated:', priceHistory);
    }, [prevPrices, prices, priceHistory]);

    const elapsedTime = (Date.now() - startTime) / 1000;
    const ticksPerSecond = (ticks / elapsedTime).toFixed(2);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const columns = [
        { headerName: 'Currency Pair', field: 'ccyPair' },
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
        { headerName: 'Change', field: 'change', cellRenderer: 'changeRenderer' },
    ];

    const rowData = Object.keys(prices).map((ccyPair) => ({
        ccyPair,
        bid: prices[ccyPair].bid.toFixed(4),
        ask: prices[ccyPair].ask.toFixed(4),
        change: prices[ccyPair].bid - (prevPrices[ccyPair]?.bid || 0),
    }));

    const getCardClass = (current, previous) => {
        if (current > previous) return classes.positive;
        if (current < previous) return classes.negative;
        return '';
    };

    const ChangeRenderer = (props) => {
        const change = props.value;
        return (
            <span>
                {change > 0 ? <ArrowUpwardIcon className={classes.icon} /> : <ArrowDownwardIcon className={classes.icon} />}
            </span>
        );
    };

    const barData = {
        labels: priceHistory.map((entry, index) => `Tick ${index + 1}`),
        datasets: [
            {
                label: 'Bid Prices',
                data: priceHistory.map((entry) => entry.bid),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Ask Prices',
                data: priceHistory.map((entry) => entry.ask),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
        ],
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
                InputLabelProps={{ className: 'font-weight-bold' }}
                InputProps={{ className: 'font-weight-bold' }}
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
                        {isReconnecting && <CircularProgress size={20} className={classes.spinner} />}
                    </Button>
                )}
            </div>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={dontReconnect}
                        onChange={(e) => setDontReconnect(e.target.checked)}
                        color="primary"
                    />
                }
                label="Don't Reconnect"
            />
            <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                    columnDefs={columns}
                    rowData={rowData}
                    frameworkComponents={{ changeRenderer: ChangeRenderer }}
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
            <Bar data={barData} />
        </Container>
    );
};

export default PriceTicker;