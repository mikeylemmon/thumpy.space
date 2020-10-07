package api

import (
	"encoding/json"
)

const (
	WS_USERS_ALL   = `user/all`
	WS_USER_UPDATE = `user/update`
	WS_USER_EVENT  = `user/event`
	WS_USER_FORCE  = `user/force`
	WS_USER_XFORM  = `user/xform`
)

type User struct {
	ClientId    int     `json:"clientId"`
	Name        string  `json:"name"`
	Instrument  string  `json:"instrument"`
	InputDevice string  `json:"inputDevice"`
	Offset      float64 `json:"offset"`
	PosX        float64 `json:"posX"`
	PosY        float64 `json:"posY"`
}

type MidiEventController struct {
	Number int    `json:"number"`
	Name   string `json:"name"`
}

type MidiEvent struct {
	Data       []int                `json:"data"`
	Channel    int                  `json:"channel"`
	Kind       string               `json:"kind"`
	Attack     float64              `json:"attack,omitempty"`
	Note       int                  `json:"note,omitempty"`
	Release    float64              `json:"release,omitempty"`
	Value      float64              `json:"value,omitempty"`
	Controller *MidiEventController `json:"controller,omitempty"`
}

type UserEvent struct {
	ClientId   int        `json:"clientId"`
	Instrument string     `json:"instrument"`
	MidiEvent  *MidiEvent `json:"midiEvent"`
	Timestamp  float64    `json:"timestamp"`
}

type UserXform struct {
	ClientId int       `json:"clientId"`
	Pos      []float64 `json:"pos"`
	Rot      []float64 `json:"rot"`
	Scale    []float64 `json:"scale"`
	Force    []float64 `json:"force"`
	Vel      []float64 `json:"vel"`
}

func ParseUserUpdate(body string) (*User, error) {
	resp := &User{}
	if err := json.Unmarshal([]byte(body), resp); err != nil {
		return nil, err
	}
	return resp, nil
}
