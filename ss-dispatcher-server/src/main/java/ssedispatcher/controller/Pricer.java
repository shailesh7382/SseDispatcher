package ssedispatcher.controller;

import ssedispatcher.controller.SseEmitterHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.math.BigDecimal;
import java.math.RoundingMode;


public class Pricer {
    private static final double BASE_PRICE = 1.10;
    private static final double MAX_VARIATION = 0.01;
    private final Random random;
    private final List<PriceSubscriber> subscribers;
    private final ScheduledExecutorService scheduler;
    private SseEmitterHelper sseEmitterHelper;

    public Pricer() {
        this.random = new Random();
        this.subscribers = new ArrayList<>();
        this.scheduler = Executors.newScheduledThreadPool(1);
    }

    public void setSseEmitterHelper(SseEmitterHelper sseEmitterHelper) {
        this.sseEmitterHelper = sseEmitterHelper;
    }

    public void addSubscriber(PriceSubscriber subscriber) {
        subscribers.add(subscriber);
    }

    public void removeSubscriber(PriceSubscriber subscriber) {
        subscribers.remove(subscriber);
    }

    public void startPriceGeneration() {
        scheduleNextPriceGeneration();
    }

    private void scheduleNextPriceGeneration() {
        long delay = random.nextInt(1000); // Random delay between 0 and 1000 milliseconds
        scheduler.schedule(this::generateAndNotifyPrice, delay, TimeUnit.MILLISECONDS);
    }


private void generateAndNotifyPrice() {
    double bid = BASE_PRICE + (random.nextDouble() * MAX_VARIATION - (MAX_VARIATION / 2));
    double ask = bid + (random.nextDouble() * 0.0001 + 0.0001); // Ensure ask is always higher than bid

    // Round bid and ask to 4 decimal places
    BigDecimal bidRounded = new BigDecimal(bid).setScale(4, RoundingMode.HALF_UP);
    BigDecimal askRounded = new BigDecimal(ask).setScale(4, RoundingMode.HALF_UP);

    notifySubscribers(bidRounded.doubleValue(), askRounded.doubleValue());
    if (sseEmitterHelper != null) {
        sseEmitterHelper.sendPriceUpdate(bidRounded.doubleValue(), askRounded.doubleValue());
    }
    scheduleNextPriceGeneration(); // Schedule the next price generation
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