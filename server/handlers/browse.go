package handlers

import (
    "encoding/json"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
    "github.com/muskskito/muskskito/scanner"
)

func ScanUrl(c *gin.Context) {
    var body struct {
        URL string `json:"url"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    threatLevel, threatDetails := scanner.ScanURL(body.URL)

    c.JSON(http.StatusOK, gin.H{
        "threatLevel":   threatLevel,
        "threatDetails": threatDetails,
    })
}

func StartBrowsing(c *gin.Context) {
    userID := c.GetString("userID")

    var body struct {
        URL          string `json:"url"`
        VpnIp        string `json:"vpnIp"`
        VpnLocation  string `json:"vpnLocation"`
        VpnCountry   string `json:"vpnCountry"`
        VpnLatitude  string `json:"vpnLatitude"`
        VpnLongitude string `json:"vpnLongitude"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var settings models.UserSettings
    if err := database.DB.First(&settings, "user_id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User settings not found"})
        return
    }

    threatLevel, threatDetails := scanner.ScanURL(body.URL)
    threatDetailsJson, _ := json.Marshal(threatDetails)

    sessionID := uuid.New().String()
    var autoDeleteAt *time.Time
    if settings.AutoDeleteSessions {
        t := time.Now().Add(time.Duration(settings.DeleteAfterMinutes) * time.Minute)
        autoDeleteAt = &t
    }

    session := models.Session{
        ID:            sessionID,
        UserID:        userID,
        URL:           body.URL,
        VpnIp:         body.VpnIp,
        VpnLocation:   body.VpnLocation,
        VpnCountry:    body.VpnCountry,
        VpnLatitude:   body.VpnLatitude,
        VpnLongitude:  body.VpnLongitude,
        ThreatLevel:   threatLevel,
        ThreatDetails: string(threatDetailsJson),
        Status:        "active",
        AutoDeleteAt:  autoDeleteAt,
    }
    if err := database.DB.Create(&session).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
        return
    }

    if threatDetails != nil {
        threat := models.Threat{
            ID:          uuid.New().String(),
            SessionID:   sessionID,
            ThreatType:  threatDetails.Type,
            Description: threatDetails.Description,
            Confidence:  87,
            Blocked:     true,
        }
        if err := database.DB.Create(&threat).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create threat"})
            return
        }
    }

    c.JSON(http.StatusOK, gin.H{
        "sessionId":     sessionID,
        "threatLevel":   threatLevel,
        "threatDetails": threatDetails,
    })
}

func NukeSession(c *gin.Context) {
    userID := c.GetString("userID")

    var body struct {
        SessionID string `json:"sessionId"`
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

    now := time.Now()
    session.Status = "deleted"
    session.DeletedAt = &now
    if err := database.DB.Save(&session).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to nuke session"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "session nuked successfully"})
}

func GetSessions(c *gin.Context) {
    userID := c.GetString("userID")

    var sessions []models.Session
    if err := database.DB.Where("user_id = ?", userID).Order("started_at desc").Find(&sessions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sessions"})
        return
    }

    c.JSON(http.StatusOK, sessions)
}
