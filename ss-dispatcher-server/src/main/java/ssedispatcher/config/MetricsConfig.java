package ssedispatcher.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ssedispatcher.metrics.CustomHttp2Metrics;

@Configuration
public class MetricsConfig {

    @Bean
    public CustomHttp2Metrics customHttp2Metrics() {
        return new CustomHttp2Metrics();
    }
}