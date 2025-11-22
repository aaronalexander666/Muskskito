package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func GetAnalyticsStats(c *gin.Context) {
    userID := c.GetString("userID")

    var sessions []models.Session
    if err := database.DB.Where("user_id = ?", userID).Find(&sessions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sessions"})
        return
    }

    var threats []models.Threat
    if err := database.DB.Find(&threats).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get threats"})
        return
    }

    totalSessions := len(sessions)
    activeSessions := 0
    safeSessions := 0
    dangerousSessions := 0
    for _, session := range sessions {
        if session.Status == "active" {
            activeSessions++
        }
        if session.ThreatLevel == "safe" {
            safeSessions++
        }
        if session.ThreatLevel == "danger" || session.ThreatLevel == "warning" {
            dangerousSessions++
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "totalSessions":     totalSessions,
        "activeSessions":    activeSessions,
        "safeSessions":      safeSessions,
        "dangerousSessions": dangerousSessions,
        "threatsDetected":   len(threats),
    })
}
