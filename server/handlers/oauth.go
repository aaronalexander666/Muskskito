package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "os"

    "github.com/gin-contrib/sessions"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

var (
    googleOauthConfig *oauth2.Config
)

func init() {
    redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
    if redirectURL == "" {
        redirectURL = "http://localhost:8080/auth/callback"
    }

    googleOauthConfig = &oauth2.Config{
        RedirectURL:  redirectURL,
        ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
        ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
        Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
        Endpoint:     google.Endpoint,
    }
}

func HandleLogin(c *gin.Context) {
    oauthStateString := uuid.New().String()
    session := sessions.Default(c)
    session.Set("oauthState", oauthStateString)
    session.Save()
    url := googleOauthConfig.AuthCodeURL(oauthStateString)
    c.Redirect(http.StatusTemporaryRedirect, url)
}

func HandleCallback(c *gin.Context) {
    session := sessions.Default(c)
    oauthState := session.Get("oauthState")
    if oauthState != c.Query("state") {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid state"})
        return
    }

    code := c.Query("code")
    token, err := googleOauthConfig.Exchange(context.Background(), code)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to exchange token"})
        return
    }

    response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
        return
    }
    defer response.Body.Close()

    var userInfo map[string]interface{}
    if err := json.NewDecoder(response.Body).Decode(&userInfo); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode user info"})
        return
    }

    email := userInfo["email"].(string)
    user, err := database.GetUserByEmail(email)
    if err != nil {
        user = models.User{
            ID:    uuid.New().String(),
            Email: email,
        }
        if err := database.CreateUser(user); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
            return
        }
    }

    session = sessions.Default(c)
    session.Set("userID", user.ID)
    if err := session.Save(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save session"})
        return
    }

    c.Redirect(http.StatusTemporaryRedirect, "/")
}
