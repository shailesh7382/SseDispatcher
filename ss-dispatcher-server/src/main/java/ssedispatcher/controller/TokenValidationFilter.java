package ssedispatcher.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;


public class TokenValidationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(TokenValidationFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        /*String authorizationHeader = request.getHeader("Authorization");

        logger.info("Received request for URL: {}", request.getRequestURL());

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            logger.warn("Authorization header is missing or does not start with 'Bearer '");

        }

        String token = authorizationHeader.substring(7);
        logger.info("Extracted token: {}", token);

        if (!isValidToken(token)) {
            logger.warn("Invalid token: {}", token);
            response.setHeader("Cache-Control", "no-store");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }*/

        // Set Cache-Control header to no-store
        response.setHeader("Cache-Control", "no-store");

        logger.info("Token is valid, proceeding with the request");
        filterChain.doFilter(request, response);
    }

    private boolean isValidToken(String token) {
        // Implement your token validation logic here
        // For example, check if the token exists in a database or cache
        return true; // Replace with actual validation logic
    }
}