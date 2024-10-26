import React, { useEffect, useState } from 'react';
import { Container, Table, TableBody, TableCell, TableHead, TableRow, Typography, Alert } from '@mui/material';

const PriceTicker = ({ userId }) => {
    const [price, setPrice] = useState({ bid: 0, ask: 0 });
    const [error, setError] = useState('');

    useEffect(() => {
        const eventSource = new EventSource(`http://localhost:8080/stream-sse?userId=${userId}`);

        eventSource.onopen = () => {
            console.log('Connection to SSE opened.');
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
                    setPrice({ bid, ask });
                }
            } catch (e) {
                console.error('Failed to parse event data:', e);
            }
        };

        eventSource.onerror = (err) => {
            console.error('EventSource failed:', err);
            setError('The server took too long to respond.');
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [userId]);

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Real-time EUR/USD Price
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Bid</TableCell>
                        <TableCell>Ask</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>{price.bid.toFixed(4)}</TableCell>
                        <TableCell>{price.ask.toFixed(4)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body1">User: {userId}</Typography>
        </Container>
    );
};

export default PriceTicker;