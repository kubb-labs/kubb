package com.example.blog

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HtmlController {

  @GetMapping("/user/login")
  fun loginUser(model: Model): String {
    model["title"] = "Blog"
    return "blog"
  }
}