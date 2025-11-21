package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/sashabaranov/go-openai"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/llm"
    "github.com/muskskito/muskskito/models"
)

func GetChatMessages(c *gin.Context) {
    userID := c.GetString("userID")
    sessionID := c.Param("sessionId")

    var session models.Session
    if err := database.DB.First(&session, "id = ? AND user_id = ?", sessionID, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
        return
    }

    var messages []models.ChatMessage
    if err := database.DB.Where("session_id = ?", sessionID).Find(&messages).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chat messages"})
        return
    }

    c.JSON(http.StatusOK, messages)
}

func SendChatMessage(c *gin.Context) {
    userID := c.GetString("userID")

    var body struct {
        SessionID string `json:"sessionId"`
        Message   string `json:"message"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var session models.Session
    if err := database.DB.First(&session, "id = ? AND user_id = ?", body.SessionID, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
        return
    }

    userMessage := models.ChatMessage{
        ID:        uuid.New().String(),
        SessionID: body.SessionID,
        UserID:    userID,
        Role:      "user",
        Content:   body.Message,
    }
    if err := database.DB.Create(&userMessage).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user message"})
        return
    }

    var dbMessages []models.ChatMessage
    if err := database.DB.Where("session_id = ?", body.SessionID).Order("created_at asc").Find(&dbMessages).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chat messages"})
        return
    }

    var messages []openai.ChatCompletionMessage
    for _, msg := range dbMessages {
        messages = append(messages, openai.ChatCompletionMessage{
            Role:    msg.Role,
            Content: msg.Content,
        })
    }

    aiResponse, err := llm.InvokeLLM(messages)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get AI response"})
        return
    }

    aiMessage := models.ChatMessage{
        ID:        uuid.New().String(),
        SessionID: body.SessionID,
        UserID:    userID,
        Role:      "assistant",
        Content:   aiResponse,
    }
    if err := database.DB.Create(&aiMessage).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save AI message"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "userMessage": body.Message,
        "aiResponse":  aiResponse,
    })
}
