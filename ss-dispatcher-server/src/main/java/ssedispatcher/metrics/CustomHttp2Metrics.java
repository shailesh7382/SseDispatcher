package ssedispatcher.metrics;

import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CustomHttp2Metrics {

    private static final Logger logger = LoggerFactory.getLogger(CustomHttp2Metrics.class);
    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final AtomicInteger activeStreams = new AtomicInteger(0);

    public void incrementConnections() {
        activeConnections.incrementAndGet();
    }

    public void decrementConnections() {
        activeConnections.decrementAndGet();
    }

    public void incrementStreams() {
        activeStreams.incrementAndGet();
    }

    public void decrementStreams() {
        activeStreams.decrementAndGet();
    }

    public int getActiveConnections() {
        return activeConnections.get();
    }

    public int getActiveStreams() {
        return activeStreams.get();
    }

    public void printMetrics() {
        logger.info("Active HTTP/2 Connections: {}", getActiveConnections());
        logger.info("Active HTTP/2 Streams: {}", getActiveStreams());
    }
}