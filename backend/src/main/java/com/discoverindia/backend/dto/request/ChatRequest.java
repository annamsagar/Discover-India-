package com.discoverindia.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ChatRequest {

    @NotBlank(message = "Message cannot be empty")
    private String message;

    private String conversationId;
    
    private List<Map<String, String>> history;
}
