package ssedispatcher.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Price {
    private BigDecimal bid;
    private BigDecimal ask;
    private String ccyPair;
    private LocalDateTime timestamp;

    public Price(BigDecimal bid, BigDecimal ask, String ccyPair, LocalDateTime timestamp) {
        this.bid = bid;
        this.ask = ask;
        this.ccyPair = ccyPair;
        this.timestamp = timestamp;
    }

    // Getters and setters
    public BigDecimal getBid() {
        return bid;
    }

    public void setBid(BigDecimal bid) {
        this.bid = bid;
    }

    public BigDecimal getAsk() {
        return ask;
    }

    public void setAsk(BigDecimal ask) {
        this.ask = ask;
    }

    public String getCcyPair() {
        return ccyPair;
    }

    public void setCcyPair(String ccyPair) {
        this.ccyPair = ccyPair;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "Price{" +
                "bid=" + bid +
                ", ask=" + ask +
                ", ccyPair='" + ccyPair + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}