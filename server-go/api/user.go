package api

import (
	"encoding/json"
	// "github.com/rs/zerolog/log"
)

const (
	WS_USER_EVENT  = `user/event`
	WS_USER_UPDATE = `user/update`
	WS_USERS_ALL   = `user/all`
)

type User struct {
	ClientId    int     `json:"clientId"`
	Name        string  `json:"name"`
	Instrument  string  `json:"instrument"`
	InputDevice string  `json:"inputDevice"`
	Offset      float64 `json:"offset"`
}

func ParseUserUpdate(body string) (*User, error) {
	user := &User{}
	if err := json.Unmarshal([]byte(body), user); err != nil {
		return nil, err
	}
	return user, nil
}
