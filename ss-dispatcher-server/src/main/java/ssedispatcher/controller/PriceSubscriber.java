package ssedispatcher.controller;

public interface PriceSubscriber {
    void onPriceUpdate(double bid, double ask);
}