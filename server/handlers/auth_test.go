package handlers

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-contrib/sessions"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
)

func TestGetMe(t *testing.T) {
    setupTestDB()
    r := setupTestRouter()

    user := models.User{ID: "1", Name: "Test User"}
    database.DB.Create(&user)

    r.GET("/me", func(c *gin.Context) {
        session := sessions.Default(c)
        session.Set("userID", "1")
        session.Save()
        c.Set("userID", "1")
        GetMe(c)
    })

    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/me", nil)
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)

    var responseUser models.User
    json.Unmarshal(w.Body.Bytes(), &responseUser)
    assert.Equal(t, user.Name, responseUser.Name)
}

func TestLogout(t *testing.T) {
    r := setupTestRouter()

    r.POST("/logout", Logout)

    w := httptest.NewRecorder()
    req, _ := http.NewRequest("POST", "/logout", nil)
    r.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
}
