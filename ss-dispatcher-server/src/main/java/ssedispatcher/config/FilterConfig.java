package ssedispatcher.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ssedispatcher.controller.TokenValidationFilter;

@Configuration
public class FilterConfig {


    @Bean
    public FilterRegistrationBean<TokenValidationFilter> tokenValidationFilter() {
        FilterRegistrationBean<TokenValidationFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new TokenValidationFilter());
        registrationBean.addUrlPatterns("/startPricing", "/pausePricing", "/startAllPricing", "/pauseAllPricing", "/pricingState");
        return registrationBean;
    }
}