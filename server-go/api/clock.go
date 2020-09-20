package api

import (
	"encoding/json"
	"time"

	"github.com/rs/zerolog/log"
)

const (
	WS_CLOCK_NOW    = `clock/now`
	WS_CLOCK_ORIGIN = `clock/origin`
)

type ClockNowResp struct {
	NowMs float64 `json:"nowMs"`
}

type ClockOriginResp struct {
	OriginMs float64 `json:"originMs"`
}

func nanoToMs(nano int64) float64 { return float64(nano) / 1000000.0 }

var origin = nanoToMs(time.Now().UnixNano())

func HandleClockNow() ([]byte, error) {
	now := time.Now()
	nowMs := nanoToMs(now.UnixNano())
	resp, err := json.Marshal(ClockNowResp{
		// NowMs: nowMs,
		// NowMs: nanoToMs(now.UnixNano()),
		NowMs: nowMs - origin,
	})
	if err != nil {
		return nil, err
	}
	// log.Debug().Float64(`now`, nowMs-origin).Msg(`Sending now`)
	return []byte(WS_CLOCK_NOW + WS_HEADER_END + string(resp)), nil
}

func HandleClockOrigin() ([]byte, error) {
	resp, err := json.Marshal(ClockOriginResp{OriginMs: origin})
	if err != nil {
		return nil, err
	}
	log.Debug().Float64(`origin`, origin).Msg(`Sending time origin`)
	return []byte(WS_CLOCK_ORIGIN + WS_HEADER_END + string(resp)), nil
}
