package handlers

import (
    "net/http"

    "github.com/gin-contrib/sessions"
    "github.com/gin-gonic/gin"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func GetMe(c *gin.Context) {
    userID := c.GetString("userID")
    if userID == "" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    var user models.User
    if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    c.JSON(http.StatusOK, user)
}

func Logout(c *gin.Context) {
    session := sessions.Default(c)
    session.Clear()
    if err := session.Save(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save session"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
}
