// src/hooks/useEventSource.js
import { useEffect, useState, useRef } from 'react';

const useEventSource = (url) => {
    const [eventSource, setEventSource] = useState(null);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url) return;

        const es = new EventSource(url);
        setEventSource(es);

        es.onmessage = (event) => {
            setData(event.data);
        };

        es.onerror = (err) => {
            setError(err);
            es.close();
        };

        return () => {
            es.close();
        };
    }, [url]);

    return { eventSource, data, error };
};

export default useEventSource;