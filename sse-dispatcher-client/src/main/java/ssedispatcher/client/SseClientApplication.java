package ssedispatcher.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;

@SpringBootApplication
public class SseClientApplication implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SseClientApplication.class);
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10, new CustomThreadFactory("SseClientScheduler"));

    public static void main(String[] args) {
        SpringApplication.run(SseClientApplication.class, args);
    }

    @Override
    public void run(String... args) {
        for (int i = 1; i <= 10; i++) {
            String userId = "testUser" + i;
            WebClient client = WebClient.create("http://localhost:8080");

            Flux<String> eventStream = client.get()
                    .uri(uriBuilder -> uriBuilder.path("/stream-sse").queryParam("userId", userId).build())
                    .retrieve()
                    .bodyToFlux(String.class);

            eventStream.subscribe(
                    event -> logger.info("Received event for {}: {}", userId, event),
                    error -> logger.error("Error receiving SSE event for {}", userId, error),
                    () -> logger.info("Event stream completed for {}", userId)
            );
        }
    }

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> customizer() {
        return factory -> factory.setPort(8081);
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