package ssedispatcher.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.stream.Collectors;

public class Pricer {
    private static final BigDecimal MAX_VARIATION = BigDecimal.valueOf(0.01);
    private static final int THREAD_POOL_SIZE = 3;
    private static final int MAX_DELAY_MS = 10;

    private final List<PriceSubscriber> subscribers;
    private final ScheduledExecutorService scheduler;
    private BaseDispatcher baseDispatcher;
    private final List<Price> prices;
    private final Map<String, BigDecimal> basePrices;
    private final Map<String, Boolean> activePairs;

    public Pricer(String configFilePath) throws IOException {
        this.subscribers = new ArrayList<>();
        this.scheduler = Executors.newScheduledThreadPool(THREAD_POOL_SIZE);
        this.basePrices = loadCurrencyPairs(configFilePath);
        this.prices = basePrices.keySet().stream()
                .map(ccyPair -> new Price(BigDecimal.ZERO, BigDecimal.ZERO, ccyPair, LocalDateTime.now()))
                .collect(Collectors.toList());
        this.activePairs = new HashMap<>();
    }

    private Map<String, BigDecimal> loadCurrencyPairs(String configFilePath) throws IOException {
        Map<String, BigDecimal> currencyPairs = new HashMap<>();
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(configFilePath);
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length == 2) {
                    currencyPairs.put(parts[0], new BigDecimal(parts[1]));
                }
            }
        }
        return currencyPairs;
    }

    public void setBaseDispatcher(BaseDispatcher baseDispatcher) {
        this.baseDispatcher = baseDispatcher;
    }

    public void addSubscriber(PriceSubscriber subscriber) {
        subscribers.add(subscriber);
    }

    public void removeSubscriber(PriceSubscriber subscriber) {
        subscribers.remove(subscriber);
    }

    public void startPriceGeneration() {
        for (Price price : prices) {
            scheduleNextPriceGeneration(price);
        }
    }

    public void startPricing(String ccyPair) {
        activePairs.put(ccyPair, true);
        scheduleNextPriceGeneration(new Price(BigDecimal.ZERO, BigDecimal.ZERO, ccyPair, LocalDateTime.now()));
    }

    public void pausePricing(String ccyPair) {
        activePairs.put(ccyPair, false);
    }

    public void startAllPricing() {
        for (String ccyPair : basePrices.keySet()) {
            startPricing(ccyPair);
        }
    }

    public void pauseAllPricing() {
        for (String ccyPair : basePrices.keySet()) {
            pausePricing(ccyPair);
        }
    }

    public Map<String, Boolean> getPricingState() {
        return new HashMap<>(activePairs);
    }

    private void scheduleNextPriceGeneration(Price price) {
        long delay = ThreadLocalRandom.current().nextInt(MAX_DELAY_MS);
        scheduler.schedule(() -> generateAndNotifyPrice(price), delay, TimeUnit.MILLISECONDS);
    }

    private void generateAndNotifyPrice(Price price) {
        if (Boolean.TRUE.equals(activePairs.get(price.getCcyPair()))) {
            BigDecimal basePrice = basePrices.get(price.getCcyPair());
            double bid = calculateBid(basePrice);
            double ask = calculateAsk(bid);

            BigDecimal bidRounded = roundToFourDecimalPlaces(bid);
            BigDecimal askRounded = roundToFourDecimalPlaces(ask);

            updatePrice(price, bidRounded, askRounded);

            notifySubscribers(bidRounded.doubleValue(), askRounded.doubleValue());
            if (baseDispatcher != null) {
                baseDispatcher.sendPriceUpdate(price);
            }
            scheduleNextPriceGeneration(price);
        }
    }

    private double calculateBid(BigDecimal basePrice) {
        return basePrice.doubleValue() + (ThreadLocalRandom.current().nextDouble() * MAX_VARIATION.doubleValue() - (MAX_VARIATION.doubleValue() / 2));
    }

    private double calculateAsk(double bid) {
        return bid + (ThreadLocalRandom.current().nextDouble() * 0.0001 + 0.0001);
    }

    private BigDecimal roundToFourDecimalPlaces(double value) {
        return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP);
    }

    private void updatePrice(Price price, BigDecimal bid, BigDecimal ask) {
        price.setBid(bid);
        price.setAsk(ask);
        price.setTimestamp(LocalDateTime.now());
    }

    private void notifySubscribers(double bid, double ask) {
        for (PriceSubscriber subscriber : subscribers) {
            subscriber.onPriceUpdate(bid, ask);
        }
    }
}