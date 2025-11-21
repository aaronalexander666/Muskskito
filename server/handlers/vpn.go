package handlers

import (
    "encoding/json"
    "math/rand"
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func GetVpnLocations(c *gin.Context) {
    userID := c.GetString("userID")

    var user models.User
    if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    var locations []models.VpnLocation
    if err := database.DB.Find(&locations).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get VPN locations"})
        return
    }

    if user.SubscriptionTier != "pro" {
        var freeLocations []models.VpnLocation
        for _, location := range locations {
            if !location.IsPro {
                freeLocations = append(freeLocations, location)
            }
        }
        locations = freeLocations
    }

    c.JSON(http.StatusOK, locations)
}

func ConnectVpn(c *gin.Context) {
    userID := c.GetString("userID")

    var user models.User
    if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    var locations []models.VpnLocation
    if err := database.DB.Find(&locations).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get VPN locations"})
        return
    }

    if user.SubscriptionTier != "pro" {
        var freeLocations []models.VpnLocation
        for _, location := range locations {
            if !location.IsPro {
                freeLocations = append(freeLocations, location)
            }
        }
        locations = freeLocations
    }

    if len(locations) == 0 {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "No VPN locations available"})
        return
    }

    var selectedLocation models.VpnLocation
    locationID := c.Query("locationId")
    if locationID != "" {
        for _, location := range locations {
            if location.ID == locationID {
                selectedLocation = location
                break
            }
        }
    } else {
        selectedLocation = locations[rand.Intn(len(locations))]
    }

    var ipPool []string
    if err := json.Unmarshal([]byte(selectedLocation.IpPool), &ipPool); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse IP pool"})
        return
    }

    randomIp := ipPool[rand.Intn(len(ipPool))]
    latency := rand.Intn(selectedLocation.LatencyMax-selectedLocation.LatencyMin) + selectedLocation.LatencyMin

    c.JSON(http.StatusOK, gin.H{
        "ip":          randomIp,
        "city":        selectedLocation.City,
        "country":     selectedLocation.Country,
        "countryCode": selectedLocation.CountryCode,
        "latitude":    selectedLocation.Latitude,
        "longitude":   selectedLocation.Longitude,
        "latency":     strconv.Itoa(latency) + "ms",
        "locationId":  selectedLocation.ID,
    })
}
