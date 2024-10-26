package ssedispatcher.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
public class SseController {

    private static final Logger logger = LoggerFactory.getLogger(SseController.class);
    private final ConcurrentHashMap<String, SseEmitter> userEmitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);

    @GetMapping("/stream-sse")
    public SseEmitter streamSse(@RequestParam String userId) {
        logger.info("Received request to stream SSE for user: {}", userId);
        SseEmitter emitter = new SseEmitter(30_000L); // Set a timeout of 30 seconds
        userEmitters.put(userId, emitter);
        logger.info("SseEmitter created and added for user: {}", userId);

        emitter.onCompletion(() -> {
            userEmitters.remove(userId);
            logger.info("SseEmitter completed for user: {}", userId);
        });
        emitter.onTimeout(() -> {
            userEmitters.remove(userId);
            logger.warn("SseEmitter timed out for user: {}", userId);
        });
        emitter.onError((e) -> {
            userEmitters.remove(userId);
            logger.error("SseEmitter encountered an error for user: {}", userId, e);
        });

        scheduler.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event().name("sse-event").data("Hello " + userId + " at " + System.currentTimeMillis()));
                logger.info("Sent SSE event to user: {}", userId);
            } catch (IOException e) {
                emitter.completeWithError(e);
                logger.error("Error sending SSE event to user: {}", userId, e);
            }
        }, 0, 1, TimeUnit.SECONDS);

        return emitter;
    }
}