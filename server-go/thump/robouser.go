package main

import (
	"encoding/json"
	"time"

	"bitbucket.org/mlem/cmpo385/thump/server-go/api"
	"github.com/rs/zerolog/log"
)

func runRoboUser1() {
	cid := nextClientId()
	user := &api.User{
		ClientId:    cid,
		Name:        `the-server`,
		Instrument:  `eightOhEight`,
		InputDevice: `metronome`,
		Offset:      8,
		PosX:        0.8,
		PosY:        0.8,
	}
	sub := NewRoboSubscription(cid)
	addSub <- sub
	events <- Event{
		Kind:       api.WS_USER_UPDATE,
		FromClient: cid,
		User:       user,
	}
	newUserEventMsg := func(ue *api.UserEvent) ([]byte, error) {
		bites, err := json.Marshal(ue)
		if err != nil {
			log.Error().Err(err).Msg(`Failed to encode robouser event`)
			return nil, err
		}
		return []byte(api.WS_USER_EVENT + api.WS_HEADER_END + string(bites)), nil
	}
	beatMs := 1000.0 / (api.Clock().BPM / 60.0)
	lastBeatAt := api.Now() + user.Offset*beatMs
	downOn := &api.MidiEvent{Kind: `noteon`, Channel: 1, Note: 34, Attack: 0.8}
	downOff := &api.MidiEvent{Kind: `noteoff`, Channel: 1, Note: 34, Attack: 0.8}
	upOn := &api.MidiEvent{Kind: `noteon`, Channel: 10, Note: 35, Attack: 0.7}
	upOff := &api.MidiEvent{Kind: `noteoff`, Channel: 10, Note: 35, Attack: 0.7}
	// bassNotes := []int{33, 28, 31, 36, 33, 28, 31, 24}
	// bassId := 0
	for {
		beatMs = 1000.0 / (api.Clock().BPM / 60.0)
		lastBeatAt += beatMs
		// bassId++
		// downOn.Note = bassNotes[bassId%len(bassNotes)]
		// downOff.Note = bassNotes[bassId%len(bassNotes)]
		// downOnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `piano`, MidiEvent: downOn, Timestamp: lastBeatAt})
		// downOffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `piano`, MidiEvent: downOff, Timestamp: lastBeatAt + 3.5*beatMs})
		downOnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: downOn, Timestamp: lastBeatAt})
		downOffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: downOff, Timestamp: lastBeatAt + 3.5*beatMs})
		lastBeatAt += beatMs
		up1OnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: upOn, Timestamp: lastBeatAt})
		up1OffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: upOff, Timestamp: lastBeatAt + 0.5*beatMs})
		lastBeatAt += beatMs
		up2OnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: upOn, Timestamp: lastBeatAt})
		up2OffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: upOff, Timestamp: lastBeatAt + 0.5*beatMs})
		lastBeatAt += beatMs
		up3OnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: upOn, Timestamp: lastBeatAt})
		up3OffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: `eightOhEight`, MidiEvent: upOff, Timestamp: lastBeatAt + 0.5*beatMs})
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: downOnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: downOffMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up1OnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up1OffMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up2OnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up2OffMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up3OnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up3OffMsg}
		time.Sleep(time.Duration(lastBeatAt-api.Now()-user.Offset*beatMs) * time.Millisecond)
	}
}
