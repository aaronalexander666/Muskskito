package models

import (
    "time"
)

type User struct {
    ID                  string    `json:"id" gorm:"primaryKey"`
    Name                string    `json:"name"`
    Email               string    `json:"email"`
    LoginMethod         string    `json:"loginMethod"`
    Role                string    `json:"role" gorm:"default:'user'"`
    SubscriptionTier    string    `json:"subscriptionTier" gorm:"default:'free'"`
    SubscriptionExpiry  *time.Time `json:"subscriptionExpiry"`
    CreatedAt           time.Time `json:"createdAt"`
    LastSignedIn        time.Time `json:"lastSignedIn"`
}

type UserSettings struct {
    ID                  string    `json:"id" gorm:"primaryKey"`
    UserID              string    `json:"userId" gorm:"unique"`
    AutoDeleteSessions  bool      `json:"autoDeleteSessions" gorm:"default:true"`
    DeleteAfterMinutes  int       `json:"deleteAfterMinutes" gorm:"default:30"`
    BlockTrackers       bool      `json:"blockTrackers" gorm:"default:true"`
    BlockAds            bool      `json:"blockAds" gorm:"default:true"`
    BlockMalware        bool      `json:"blockMalware" gorm:"default:true"`
    EnableAiAssistant   bool      `json:"enableAiAssistant" gorm:"default:true"`
    PreferredVpnCountry string    `json:"preferredVpnCountry"`
    ThreatSensitivity   string    `json:"threatSensitivity" gorm:"default:'medium'"`
    CreatedAt           time.Time `json:"createdAt"`
    UpdatedAt           time.Time `json:"updatedAt"`
}

type VpnLocation struct {
    ID          string    `json:"id" gorm:"primaryKey"`
    Country     string    `json:"country"`
    CountryCode string    `json:"countryCode"`
    City        string    `json:"city"`
    Latitude    string    `json:"latitude"`
    Longitude   string    `json:"longitude"`
    IpPool      string    `json:"ipPool" gorm:"type:json"`
    LatencyMin  int       `json:"latencyMin"`
    LatencyMax  int       `json:"latencyMax"`
    IsPro       bool      `json:"isPro" gorm:"default:false"`
    CreatedAt   time.Time `json:"createdAt"`
}

type Session struct {
    ID            string    `json:"id" gorm:"primaryKey"`
    UserID        string    `json:"userId"`
    URL           string    `json:"url"`
    VpnIp         string    `json:"vpnIp"`
    VpnLocation   string    `json:"vpnLocation"`
    VpnCountry    string    `json:"vpnCountry"`
    VpnLatitude   string    `json:"vpnLatitude"`
    VpnLongitude  string    `json:"vpnLongitude"`
    ThreatLevel   string    `json:"threatLevel" gorm:"default:'safe'"`
    ThreatDetails string    `json:"threatDetails" gorm:"type:json"`
    Status        string    `json:"status" gorm:"default:'active'"`
    AutoDeleteAt  *time.Time `json:"autoDeleteAt"`
    StartedAt     time.Time `json:"startedAt"`
    EndedAt       *time.Time `json:"endedAt"`
    DeletedAt     *time.Time `json:"deletedAt"`
}

type Threat struct {
    ID          string    `json:"id"gorm:"primaryKey"`
    SessionID   string    `json:"sessionId"`
    ThreatType  string    `json:"threatType"`
    Description string    `json:"description"`
    Confidence  int       `json:"confidence"`
    Blocked     bool      `json:"blocked" gorm:"default:true"`
    DetectedAt  time.Time `json:"detectedAt"`
}

type ChatMessage struct {
    ID        string    `json:"id" gorm:"primaryKey"`
    SessionID string    `json:"sessionId"`
    UserID    string    `json:"userId"`
    Role      string    `json:"role"`
    Content   string    `json:"content"`
    CreatedAt time.Time `json:"createdAt"`
}

type Payment struct {
    ID                string    `json:"id" gorm:"primaryKey"`
    UserID            string    `json:"userId"`
    Amount            int       `json:"amount"`
    Currency          string    `json:"currency" gorm:"default:'USD'"`
    Status            string    `json:"status" gorm:"default:'pending'"`
    SubscriptionTier  string    `json:"subscriptionTier"`
    SubscriptionMonths int       `json:"subscriptionMonths" gorm:"default:1"`
    PaymentMethod     string    `json:"paymentMethod"`
    CreatedAt         time.Time `json:"createdAt"`
    CompletedAt       *time.Time `json:"completedAt"`
}
