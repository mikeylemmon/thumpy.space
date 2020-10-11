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
		Instrument:  `metronome`,
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
	lastBpm := 0.0
	bpm := api.Clock().BPM
	beatMs := 1000.0 / (bpm / 60.0)
	lastBeatAt := api.Now() + user.Offset*beatMs
	chgOn := &api.MidiEvent{Kind: `noteon`, Channel: 1, Note: api.NOTE_METRONOME_BPM_CHANGED, Attack: 0.8}
	chgOff := &api.MidiEvent{Kind: `noteoff`, Channel: 1, Note: api.NOTE_METRONOME_BPM_CHANGED, Attack: 0.8}
	downOn := &api.MidiEvent{Kind: `noteon`, Channel: 1, Note: api.NOTE_METRONOME_DOWN, Attack: 0.8}
	downOff := &api.MidiEvent{Kind: `noteoff`, Channel: 1, Note: api.NOTE_METRONOME_DOWN, Attack: 0.8}
	upOn := &api.MidiEvent{Kind: `noteon`, Channel: 1, Note: api.NOTE_METRONOME_UP, Attack: 0.7}
	upOff := &api.MidiEvent{Kind: `noteoff`, Channel: 1, Note: api.NOTE_METRONOME_UP, Attack: 0.7}
	for {
		clk := api.Clock()
		bpm = clk.BPM
		beatMs = 1000.0 / (bpm / 60.0)
		downAt := lastBeatAt
		downOnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: downOn, Timestamp: lastBeatAt})
		downOffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: downOff, Timestamp: lastBeatAt + 3.5*beatMs})
		lastBeatAt += beatMs
		up1OnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: upOn, Timestamp: lastBeatAt})
		up1OffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: upOff, Timestamp: lastBeatAt + 0.5*beatMs})
		lastBeatAt += beatMs
		up2OnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: upOn, Timestamp: lastBeatAt})
		up2OffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: upOff, Timestamp: lastBeatAt + 0.5*beatMs})
		lastBeatAt += beatMs
		up3OnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: upOn, Timestamp: lastBeatAt})
		up3OffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: upOff, Timestamp: lastBeatAt + 0.5*beatMs})
		lastBeatAt += beatMs
		if bpm != lastBpm {
			// bpm changed, signal to clients that there's a new downbeat
			lastBpm = bpm
			go func(da float64) {
				// Send a clock update (new BPM) just before the bpm change takes effect
				time.Sleep(time.Duration(1000*(da-api.Now()-400)) * time.Microsecond)
				clkMsg, _ := api.NewClockUpdateMsg(&clk, 0)
				events <- Event{Kind: api.WS_CLOCK_UPDATE, FromClient: cid, Raw: clkMsg}
			}(downAt)
			chgOnMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: chgOn, Timestamp: downAt})
			chgOffMsg, _ := newUserEventMsg(&api.UserEvent{ClientId: cid, Instrument: user.Instrument, MidiEvent: chgOff, Timestamp: downAt + 3.5*beatMs})
			events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: chgOnMsg}
			events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: chgOffMsg}
		}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: downOnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: downOffMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up1OnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up1OffMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up2OnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up2OffMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up3OnMsg}
		events <- Event{Kind: api.WS_USER_EVENT, FromClient: cid, Raw: up3OffMsg}
		time.Sleep(time.Duration(1000*(lastBeatAt-api.Now()-user.Offset*beatMs)) * time.Microsecond)
	}
}
