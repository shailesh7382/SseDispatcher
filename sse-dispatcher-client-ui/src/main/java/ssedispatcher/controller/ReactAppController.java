package ssedispatcher.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactAppController {

    @RequestMapping(value = "/{path:[^\\.]*}")
    public String redirect() {
        // Forward to the index.html to let React handle the routing
        return "forward:/index.html";
    }
}