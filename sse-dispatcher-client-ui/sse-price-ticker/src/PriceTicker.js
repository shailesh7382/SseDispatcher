import React, { useEffect, useState, useRef } from 'react';
import { Container, Typography, Alert, TextField, Button, FormHelperText, Card, CardContent, Grid, Paper, CircularProgress } from '@mui/material';
import { makeStyles } from '@mui/styles';
import 'bootstrap/dist/css/bootstrap.min.css';
import config from './config';

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
    card: {
        minWidth: 150,
        textAlign: 'center',
        margin: '8px',
    },
    cardContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    price: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
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
}));

const PriceTicker = () => {
    const classes = useStyles();
    const [price, setPrice] = useState({ bid: 0, ask: 0 });
    const [prevPrice, setPrevPrice] = useState({ bid: 0, ask: 0 });
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
                    const bid = parseFloat(data.bid);
                    const ask = parseFloat(data.ask);
                    console.log(`Parsed bid: ${bid}, ask: ${ask}`);
                    setPrevPrice(price);
                    setPrice({ bid, ask });
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

    // Function to determine the CSS class for price cards
    const getCardClass = (current, previous) => {
        if (current > previous) return classes.positive;
        if (current < previous) return classes.negative;
        return '';
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

    return (
        <Container>
            <Typography variant="h4" gutterBottom className="font-weight-bold">
                Real-time EUR/USD Price
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
            <Grid container justifyContent="center">
                <Card className={`${classes.card} ${getCardClass(price.bid, prevPrice.bid)}`}>
                    <CardContent className={classes.cardContent}>
                        <Typography variant="h6">Bid</Typography>
                        <Typography className={classes.price}>{price.bid.toFixed(4)}</Typography>
                    </CardContent>
                </Card>
                <Card className={`${classes.card} ${getCardClass(price.ask, prevPrice.ask)}`}>
                    <CardContent className={classes.cardContent}>
                        <Typography variant="h6">Ask</Typography>
                        <Typography className={classes.price}>{price.ask.toFixed(4)}</Typography>
                    </CardContent>
                </Card>
            </Grid>
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