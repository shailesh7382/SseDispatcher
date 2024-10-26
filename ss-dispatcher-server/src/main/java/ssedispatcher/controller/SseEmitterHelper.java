package ssedispatcher.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import ssedispatcher.metrics.CustomHttp2Metrics;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;

public class SseEmitterHelper {

    private static final Logger logger = LoggerFactory.getLogger(SseEmitterHelper.class);
    private final ConcurrentHashMap<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler;
    private final CustomHttp2Metrics customHttp2Metrics;
    private final Pricer pricer;

    public SseEmitterHelper(ScheduledExecutorService scheduler, CustomHttp2Metrics customHttp2Metrics, Pricer pricer) {
        this.scheduler = scheduler;
        this.customHttp2Metrics = customHttp2Metrics;
        this.pricer = pricer;
        this.pricer.setSseEmitterHelper(this); // Set the SseEmitterHelper in Pricer
    }

    public SseEmitter createEmitter(String userId) {
        logger.info("Received request to stream SSE for user: {}", userId);
        customHttp2Metrics.incrementConnections();
        SseEmitter emitter = new SseEmitter(30_000L); // Set a timeout of 30 seconds
        userEmitters.put(userId, emitter);
        logger.info("SseEmitter created and added for user: {}", userId);

        emitter.onCompletion(() -> {
            userEmitters.remove(userId);
            customHttp2Metrics.decrementConnections();
            logger.info("SseEmitter completed for user: {}", userId);
        });
        emitter.onTimeout(() -> {
            userEmitters.remove(userId);
            customHttp2Metrics.decrementConnections();
            logger.warn("SseEmitter timed out for user: {}", userId);
        });
        emitter.onError((e) -> {
            userEmitters.remove(userId);
            customHttp2Metrics.decrementConnections();
            if (e instanceof java.net.http.HttpTimeoutException) {
                logger.error("HTTP/2 stream timeout for user: {}", userId, e);
            } else if (e instanceof java.net.http.HttpConnectTimeoutException) {
                logger.error("HTTP/2 connection timeout for user: {}", userId, e);
            } else {
                logger.error("SseEmitter encountered an error for user: {}", userId, e);
            }
            emitter.completeWithError(e);
        });

        return emitter;
    }

    public void sendPriceUpdate(double bid, double ask) {
        for (String userId : userEmitters.keySet()) {
            SseEmitter emitter = userEmitters.get(userId);
            try {
                customHttp2Metrics.incrementStreams();
                String jsonData = "{\"bid\": " + bid + ", \"ask\": " + ask + "}";
//                String message = "data: " + jsonData + "\n\n";

                emitter.send(SseEmitter.event()./*name("price-update").*/data(jsonData));
                logger.info("{} -> {}", userId, jsonData);
            } catch (IOException e) {
                customHttp2Metrics.decrementStreams();
                emitter.completeWithError(e);
                logger.error("Error sending price update to user: {}", userId, e);
            }
        }
    }
}