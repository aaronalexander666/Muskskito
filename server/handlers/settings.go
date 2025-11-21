package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func GetSettings(c *gin.Context) {
    userID := c.GetString("userID")

    var settings models.UserSettings
    if err := database.DB.First(&settings, "user_id = ?", userID).Error; err != nil {
        // If the user has no settings, create a new UserSettings object with default values.
        settings = models.UserSettings{
            ID:                  uuid.New().String(),
            UserID:              userID,
            AutoDeleteSessions:  true,
            DeleteAfterMinutes:  30,
            BlockTrackers:       true,
            BlockAds:            true,
            BlockMalware:        true,
            EnableAiAssistant:   true,
            ThreatSensitivity:   "medium",
        }
        if err := database.DB.Create(&settings).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user settings"})
            return
        }
    }

    c.JSON(http.StatusOK, settings)
}

func UpdateSettings(c *gin.Context) {
    userID := c.GetString("userID")

    var settings models.UserSettings
    if err := database.DB.First(&settings, "user_id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User settings not found"})
        return
    }

    if err := c.ShouldBindJSON(&settings); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if err := database.DB.Save(&settings).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user settings"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "settings updated successfully"})
}
