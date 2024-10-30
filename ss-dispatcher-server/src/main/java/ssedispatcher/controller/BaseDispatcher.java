package ssedispatcher.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import ssedispatcher.metrics.CustomHttp2Metrics;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;

public class BaseDispatcher {

    private static final Logger logger = LoggerFactory.getLogger(BaseDispatcher.class);
    private static final long SSE_TIMEOUT = 300_000L; // 300 seconds
    private final ConcurrentHashMap<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler;
    private final CustomHttp2Metrics customHttp2Metrics;
    private final Pricer pricer;

    public BaseDispatcher(ScheduledExecutorService scheduler, CustomHttp2Metrics customHttp2Metrics, Pricer pricer) {
        this.scheduler = scheduler;
        this.customHttp2Metrics = customHttp2Metrics;
        this.pricer = pricer;
        this.pricer.setBaseDispatcher(this); // Set the SseEmitterHelper in Pricer
    }

    public SseEmitter createEmitter(String userId) {
        logger.info("Received request to stream SSE for user: {}", userId);
        customHttp2Metrics.incrementConnections();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        userEmitters.put(userId, emitter);
        logger.info("SseEmitter created and added for user: {}", userId);

        emitter.onCompletion(() -> handleEmitterCompletion(userId));
        emitter.onTimeout(() -> handleEmitterTimeout(userId));
        emitter.onError(e -> handleEmitterError(userId, e));

        return emitter;
    }

    private void handleEmitterCompletion(String userId) {
        userEmitters.remove(userId);
        customHttp2Metrics.decrementConnections();
        logger.info("SseEmitter completed for user: {}", userId);
    }

    private void handleEmitterTimeout(String userId) {
        userEmitters.remove(userId);
        customHttp2Metrics.decrementConnections();
        logger.warn("SseEmitter timed out for user: {}", userId);
    }

    private void handleEmitterError(String userId, Throwable e) {
        userEmitters.remove(userId);
        customHttp2Metrics.decrementConnections();
        logger.error("SseEmitter encountered an error for user: {}", userId, e);
    }

    public void sendPriceUpdate(Price price) {
        userEmitters.forEach((userId, emitter) -> {
            try {
                customHttp2Metrics.incrementStreams();
                emitter.send(price);
//                logger.info("{} -> {}", userId, price);
            } catch (IOException e) {
                customHttp2Metrics.decrementStreams();
                emitter.completeWithError(e);
                logger.error("Error sending price update to user: {}", userId, e);
            }
        });
    }
}