package ssedispatcher.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import ssedispatcher.metrics.CustomHttp2Metrics;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

@RestController
public class SseController {

    private static final Logger logger = LoggerFactory.getLogger(SseController.class);
    private final ScheduledExecutorService scheduler;
    private final CustomHttp2Metrics customHttp2Metrics;
    private final BaseDispatcher baseDispatcher;
    private final Pricer pricer;

    public SseController(CustomHttp2Metrics customHttp2Metrics) {
        this.customHttp2Metrics = customHttp2Metrics;
        this.scheduler = Executors.newScheduledThreadPool(10, new CustomThreadFactory("SseScheduler"));
        this.pricer = new Pricer();
        this.baseDispatcher = new BaseDispatcher(scheduler, customHttp2Metrics, pricer);
        this.pricer.startPriceGeneration(); // Start price generation here
        scheduleMetricsPrinting();
    }

    @GetMapping("/stream-sse")
    public SseEmitter streamSse(@RequestParam String userId) {
        return baseDispatcher.createEmitter(userId);
    }

    private void scheduleMetricsPrinting() {
        scheduler.scheduleAtFixedRate(() -> {
            customHttp2Metrics.printMetrics();
        }, 0, 1, TimeUnit.MINUTES); // Adjust the period as needed
    }

    private static class CustomThreadFactory implements ThreadFactory {
        private final String namePrefix;
        private int threadNumber = 1;

        CustomThreadFactory(String namePrefix) {
            this.namePrefix = namePrefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, namePrefix + "-thread-" + threadNumber++);
            t.setDaemon(true);
            return t;
        }
    }
}