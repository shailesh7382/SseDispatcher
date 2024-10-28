package ssedispatcher.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import ssedispatcher.metrics.CustomHttp2Metrics;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    public SseController(CustomHttp2Metrics customHttp2Metrics) throws IOException {
        this.customHttp2Metrics = customHttp2Metrics;
        this.scheduler = Executors.newScheduledThreadPool(10, new CustomThreadFactory("SseScheduler"));
        this.pricer = new Pricer("ccypair-list.csv"); // Provide the path to the config file
        this.baseDispatcher = new BaseDispatcher(scheduler, customHttp2Metrics, pricer);
        this.pricer.startPriceGeneration(); // Start price generation here
        scheduleMetricsPrinting();
    }

    @GetMapping("/stream-sse")
    public SseEmitter streamSse(@RequestParam String userId) {
        return baseDispatcher.createEmitter(userId);
    }

    @GetMapping("/login")
    public String loginUser(@RequestParam String userId) {
        // Generate a unique token for the user
        String token = UUID.randomUUID().toString();
        logger.info("User {} logged in with token {}", userId, token);
        return token;
    }

    @GetMapping("/ccyPairs")
    public List<String> getCcyPairs() throws IOException {
        return readCcyPairsFromCsv("ccypair-list.csv");
    }

    @GetMapping("/startPricing")
    public String startPricing(@RequestParam String ccyPair) {
        pricer.startPricing(ccyPair);
        logger.info("Started pricing for currency pair: {}", ccyPair);
        return "Started pricing for " + ccyPair;
    }

    @GetMapping("/pausePricing")
    public String pausePricing(@RequestParam String ccyPair) {
        pricer.pausePricing(ccyPair);
        logger.info("Paused pricing for currency pair: {}", ccyPair);
        return "Paused pricing for " + ccyPair;
    }

    @GetMapping("/startAllPricing")
    public String startAllPricing() {
        pricer.startAllPricing();
        logger.info("Started pricing for all currency pairs");
        return "Started pricing for all currency pairs";
    }

    @GetMapping("/pauseAllPricing")
    public String pauseAllPricing() {
        pricer.pauseAllPricing();
        logger.info("Paused pricing for all currency pairs");
        return "Paused pricing for all currency pairs";
    }

    @GetMapping("/pricingState")
    public Map<String, Boolean> getPricingState() {
        return pricer.getPricingState();
    }

    private List<String> readCcyPairsFromCsv(String filePath) throws IOException {
        List<String> ccyPairs = new ArrayList<>();
        ClassPathResource resource = new ClassPathResource(filePath);
        try (InputStream inputStream = resource.getInputStream();
             BufferedReader br = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = br.readLine()) != null) {
                ccyPairs.add(line.split(",")[0]);
            }
        }
        return ccyPairs;
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