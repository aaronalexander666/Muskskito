package handlers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-contrib/sessions"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func TestGetSettings(t *testing.T) {
    setupTestDB()
    r := setupTestRouter()

    r.GET("/settings", func(c *gin.Context) {
        session := sessions.Default(c)
        session.Set("userID", "1")
        session.Save()
        c.Set("userID", "1")
        GetSettings(c)
    })

    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/settings", nil)
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)

    var responseSettings models.UserSettings
    json.Unmarshal(w.Body.Bytes(), &responseSettings)
    assert.Equal(t, "1", responseSettings.UserID)
}

func TestUpdateSettings(t *testing.T) {
    setupTestDB()
    r := setupTestRouter()

    settings := models.UserSettings{ID: uuid.New().String(), UserID: "1"}
    database.DB.Create(&settings)

    r.PUT("/settings", func(c *gin.Context) {
        session := sessions.Default(c)
        session.Set("userID", "1")
        session.Save()
        c.Set("userID", "1")
        UpdateSettings(c)
    })

    updatedSettings := models.UserSettings{BlockAds: false}
    jsonValue, _ := json.Marshal(updatedSettings)

    w := httptest.NewRecorder()
    req, _ := http.NewRequest("PUT", "/settings", bytes.NewBuffer(jsonValue))
    req.Header.Set("Content-Type", "application/json")
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
}
