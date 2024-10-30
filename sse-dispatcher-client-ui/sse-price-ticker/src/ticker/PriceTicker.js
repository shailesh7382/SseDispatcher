import React, { useEffect, useState, useRef } from 'react';
import { Container, Typography, TextField, Button, FormHelperText, CircularProgress, Paper, FormControlLabel, Checkbox, Alert, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';
import config from './config';
import ChangeRenderer from './ChangeRenderer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const useStyles = makeStyles(() => ({
    helperText: {
        fontSize: '0.75rem',
        marginLeft: '8px',
    },
    buttonContainer: {
        marginTop: '16px',
    },
    button: {
        marginRight: '8px',
        marginBottom: '8px',
    },
    spinner: {
        marginLeft: '8px',
    },
    greenButton: {
        backgroundColor: 'green',
        color: 'white',
        '&:hover': {
            backgroundColor: 'darkgreen',
        },
    },
    redButton: {
        backgroundColor: 'red',
        color: 'white',
        '&:hover': {
            backgroundColor: 'darkred',
        },
    },
    gridContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
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
    const [priceHistory, setPriceHistory] = useState({});
    const [ccyPairs, setCcyPairs] = useState([]);
    const [pricingState, setPricingState] = useState({});
    const [token, setToken] = useState('token');
    const eventSourceRef = useRef(null);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleOpen = () => {
        setConnectionClosed(false);
        setStartTime(Date.now());
        setTicks(0);
        setReconnectAttempts(0);
        setIsReconnecting(false);
    };

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.error) {
                setError(data.message);
            } else {
                const { bid, ask, ccyPair } = data;

                setPrices((prevPrices) => {
                    const prevBid = prevPrices[ccyPair]?.bid;
                    const prevAsk = prevPrices[ccyPair]?.ask;

                    setPrevPrices((prevPrices) => ({
                        ...prevPrices,
                        [ccyPair]: { bid: prevBid, ask: prevAsk }
                    }));

                    return {
                        ...prevPrices,
                        [ccyPair]: { bid, ask }
                    };
                });

                setPriceHistory((prevHistory) => {
                    const newHistory = { ...prevHistory };
                    if (!newHistory[ccyPair]) {
                        newHistory[ccyPair] = [];
                    }
                    newHistory[ccyPair].push({ bid, ask });
                    if (newHistory[ccyPair].length > 10) {
                        newHistory[ccyPair].shift();
                    }
                    return newHistory;
                });

                setTicks((prevTicks) => prevTicks + 1);
            }
        } catch (e) {
            console.error('Failed to parse event data:', e);
        }
    };

    const handleError = async (err) => {
        try {
            const errorData = JSON.parse(err.data);
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
        const eventSource = new EventSource(`${config.urls.sse}?userId=${userId}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = handleOpen;
        eventSource.onmessage = handleMessage;
        eventSource.onerror = handleError;
    };

    const handleSubscribe = async () => {
        if (userId.trim() !== '') {
            try {
                const response = await axios.post(`${config.urls.login}`, { userId: userId.trim() }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                setToken(response.data.token);
                setSubscribed(true);
                createEventSource();
            } catch (error) {
                setError('Failed to login and get token.');
            }
        }
    };

    const startAllPricing = () => {
        axios.get(config.urls.startAllPricing, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                console.log(response.data);
                fetchPricingState();
            })
            .catch(error => {
                console.error('Error starting all pricing:', error);
            });
    };

    const pauseAllPricing = () => {
        axios.get(config.urls.pauseAllPricing, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                console.log(response.data);
                fetchPricingState();
            })
            .catch(error => {
                console.error('Error pausing all pricing:', error);
            });
    };

    const fetchPricingState = () => {
        axios.get(config.urls.pricingState, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                setPricingState(response.data);
            })
            .catch(error => {
                console.error('Error fetching pricing state:', error);
            });
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

    useEffect(() => {
        if (token) {
            // Fetch the list of currency pairs
            axios.get(config.urls.ccyPairs, { headers: { Authorization: `Bearer ${token}` } })
                .then(response => {
                    setCcyPairs(response.data);
                })
                .catch(error => {
                    console.error('Error fetching currency pairs:', error);
                });

            // Fetch the pricing state
            fetchPricingState();
        }
    }, [token]);

    const startPricing = (ccyPair) => {
        // Call the startPricing API
        axios.get(config.urls.startPricing, { params: { ccyPair }, headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                console.log(response.data);
                fetchPricingState();
            })
            .catch(error => {
                console.error('Error starting pricing:', error);
            });
    };

    const pausePricing = (ccyPair) => {
        // Call the pausePricing API
        axios.get(config.urls.pausePricing, { params: { ccyPair }, headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                console.log(response.data);
                fetchPricingState();
            })
            .catch(error => {
                console.error('Error pausing pricing:', error);
            });
    };

    const highlightChangedDigits = (current, previous, reverse = false) => {
        if (!previous) return current;

        const currentStr = current.toFixed(4);
        const previousStr = previous.toFixed(4);

        const digits = currentStr.split('').map((char, index) => {
            let style = {};
            if (index === currentStr.length - 1) {
                style = { fontSize: '0.75em' }; // Decrease font size for the last digit
            } else if (index === currentStr.length - 3 || index === currentStr.length - 2) {
                style = { fontSize: '1.25em' }; // Increase font size for the 2nd and 3rd decimal places
            }

            if (char !== previousStr[index]) {
                style.color = char > previousStr[index] ? 'green' : 'red';
            }

            return <span key={index} style={style}>{char}</span>;
        });

        return reverse ? digits.reverse() : digits;
    };

    const columns = [
        { headerName: 'Currency Pair', field: 'ccyPair', width: 150 },
        {
            headerName: 'Bid',
            field: 'bid',
            cellRenderer: (params) => highlightChangedDigits(params.value, prevPrices[params.data.ccyPair]?.bid),
            cellStyle: { textAlign: 'right' },
            width: 100 // Reduce the width of the Bid column
        },
        {
            headerName: 'Ask',
            field: 'ask',
            cellRenderer: (params) => highlightChangedDigits(params.value, prevPrices[params.data.ccyPair]?.ask, true),
            cellStyle: { textAlign: 'left' },
            width: 100 // Reduce the width of the Ask column
        },
        {
            headerName: 'Action',
            field: 'action',
            cellRenderer: (params) => (
                <div>
                    <IconButton className={classes.greenButton} onClick={() => startPricing(params.data.ccyPair)} disabled={pricingState[params.data.ccyPair]}>
                        <PlayArrowIcon />
                    </IconButton>
                    <IconButton className={classes.redButton} onClick={() => pausePricing(params.data.ccyPair)} disabled={!pricingState[params.data.ccyPair]}>
                        <PauseIcon />
                    </IconButton>
                </div>
            ),
            width: 150
        }
    ];

    const rowData = ccyPairs.map((ccyPair) => ({
        ccyPair,
        bid: prices[ccyPair]?.bid || 0,
        ask: prices[ccyPair]?.ask || 0,
    }));

    const renderBarCharts = () => {
        return Object.keys(prices).map((ccyPair) => {
            const ccyPairHistory = priceHistory[ccyPair] || [];
            const barData = {
                labels: ccyPairHistory.map((entry, index) => `Tick ${index + 1}`),
                datasets: [
                    {
                        label: 'Bid Prices',
                        data: ccyPairHistory.map((entry) => entry.bid),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        barThickness: 10, // Adjust the bar thickness
                    },
                    {
                        label: 'Ask Prices',
                        data: ccyPairHistory.map((entry) => entry.ask),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        barThickness: 10, // Adjust the bar thickness
                    },
                ]
            };

            const options = {
                scales: {
                    x: {
                        display: false // Hide the x-axis legend ticks
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            };

            return (
                <div key={ccyPair} style={{ width: '300px', height: '200px', margin: '20px' }}>
                    <Typography variant="h6">{ccyPair}</Typography>
                    <Bar data={barData} options={options} />
                </div>
            );
        });
    };

    const handleSubscribe50Users = async () => {
        for (let i = 1; i <= 50; i++) {
            const userId = `user${i}`;
            try {
                const response = await axios.post(`${config.urls.login}`, { userId: userId.trim() }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const token = response.data.token;
                await axios.get(config.urls.startAllPricing, { headers: { Authorization: `Bearer ${token}` } });

                // Create an SSE connection for each user
                const eventSource = new EventSource(`${config.urls.sse}?userId=${userId}`);
                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log(`User ${userId} received data:`, data);
                };
                eventSource.onerror = (err) => {
                    console.error(`User ${userId} encountered an error:`, err);
                    eventSource.close();
                };
            } catch (error) {
                console.error(`Failed to subscribe and start pricing for ${userId}:`, error);
            }
        }
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
                <Button
                    variant="contained"
                    color="primary"
                    onClick={startAllPricing}
                    className={`${classes.button} font-weight-bold`}
                >
                    Start All
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={pauseAllPricing}
                    className={`${classes.button} font-weight-bold`}
                >
                    Pause All
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubscribe50Users}
                    className={`${classes.button} font-weight-bold`}
                >
                    Subscribe 50 Users and Start All Pricing
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
            <div className={classes.gridContainer}>
                <div className="ag-theme-alpine" style={{ height: 400, width: '80%' }}>
                    <AgGridReact
                        columnDefs={columns}
                        rowData={rowData}
                        frameworkComponents={{ changeRenderer: ChangeRenderer }}
                        suppressScrollOnNewData={true}
                        deltaRowDataMode={true}
                        getRowNodeId={(data) => data.ccyPair}
                    />
                </div>
            </div>
            {error && <Alert severity="error" className="font-weight-bold">{error}</Alert>}
            <Typography variant="body1" className="font-weight-bold">User: {userId}</Typography>
            <Paper className={`${classes.notesPanel} font-weight-bold`}>
                <Typography variant="body2">
                    Update Speed: {ticksPerSecond} ticks per second
                </Typography>
            </Paper>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {renderBarCharts()}
            </div>
        </Container>
    );
};

export default PriceTicker;