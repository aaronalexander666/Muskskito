package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func CreatePayment(c *gin.Context) {
    userID := c.GetString("userID")

    var body struct {
        Tier   string `json:"tier"`
        Months int    `json:"months"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    amount := body.Months * 999 // $9.99 per month in cents
    paymentID := uuid.New().String()

    payment := models.Payment{
        ID:                 paymentID,
        UserID:             userID,
        Amount:             amount,
        Currency:           "USD",
        Status:             "pending",
        SubscriptionTier:   body.Tier,
        SubscriptionMonths: body.Months,
    }
    if err := database.DB.Create(&payment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "paymentId": paymentID,
        "amount":    amount,
        "currency":  "USD",
    })
}

func ConfirmPayment(c *gin.Context) {
    userID := c.GetString("userID")

    var body struct {
        PaymentID string `json:"paymentId"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var payment models.Payment
    if err := database.DB.First(&payment, "id = ?", body.PaymentID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
        return
    }

    now := time.Now()
    payment.Status = "completed"
    payment.CompletedAt = &now
    if err := database.DB.Save(&payment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm payment"})
        return
    }

    var user models.User
    if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    expiryDate := time.Now().AddDate(0, payment.SubscriptionMonths, 0)
    user.SubscriptionTier = payment.SubscriptionTier
    user.SubscriptionExpiry = &expiryDate
    if err := database.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user subscription"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "payment confirmed successfully"})
}
