package ssedispatcher.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class Pricer {
    private static final BigDecimal BASE_PRICE = BigDecimal.valueOf(1.10);
    private static final BigDecimal MAX_VARIATION = BigDecimal.valueOf(0.01);
    private static final int THREAD_POOL_SIZE = 3;
    private static final int MAX_DELAY_MS = 1000;

    private final List<PriceSubscriber> subscribers;
    private final ScheduledExecutorService scheduler;
    private BaseDispatcher baseDispatcher;
    private final Price eurUsdPrice;
    private final Price audUsdPrice;
    private final Price gbpUsdPrice;

    public Pricer() {
        this.subscribers = new ArrayList<>();
        this.scheduler = Executors.newScheduledThreadPool(THREAD_POOL_SIZE);
        this.eurUsdPrice = new Price(BigDecimal.ZERO, BigDecimal.ZERO, "EURUSD", LocalDateTime.now());
        this.audUsdPrice = new Price(BigDecimal.ZERO, BigDecimal.ZERO, "AUDUSD", LocalDateTime.now());
        this.gbpUsdPrice = new Price(BigDecimal.ZERO, BigDecimal.ZERO, "GBPUSD", LocalDateTime.now());
    }

    public void setSseEmitterHelper(BaseDispatcher baseDispatcher) {
        this.baseDispatcher = baseDispatcher;
    }

    public void addSubscriber(PriceSubscriber subscriber) {
        subscribers.add(subscriber);
    }

    public void removeSubscriber(PriceSubscriber subscriber) {
        subscribers.remove(subscriber);
    }

    public void startPriceGeneration() {
        scheduleNextPriceGeneration(eurUsdPrice);
        scheduleNextPriceGeneration(audUsdPrice);
        scheduleNextPriceGeneration(gbpUsdPrice);
    }

    private void scheduleNextPriceGeneration(Price price) {
        long delay = ThreadLocalRandom.current().nextInt(MAX_DELAY_MS);
        scheduler.schedule(() -> generateAndNotifyPrice(price), delay, TimeUnit.MILLISECONDS);
    }

    private void generateAndNotifyPrice(Price price) {
        double bid = calculateBid();
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

    private double calculateBid() {
        return BASE_PRICE.doubleValue() + (ThreadLocalRandom.current().nextDouble() * MAX_VARIATION.doubleValue() - (MAX_VARIATION.doubleValue() / 2));
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

    public static void main(String[] args) {
        Pricer pricer = new Pricer();
        pricer.addSubscriber((bid, ask) -> System.out.printf("Bid: %.5f, Ask: %.5f%n", bid, ask));
        pricer.startPriceGeneration();
    }
}